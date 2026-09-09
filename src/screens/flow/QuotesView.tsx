import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Badge, Button, Card, EmptyState, ErrorBanner, FormField, KeyValue, LoadingBlock, ModalSheet, Segments } from '../../components/ui';
import { useLanguage } from '../../context/LanguageContext';
import { euro, shortDateTime, titleCase } from '../../lib/format';
import { supabase } from '../../lib/supabase';
import { colors, spacing } from '../../theme';
import type { QuoteRequest } from '../../types';

const statuses = ['new', 'contacted', 'quoted', 'won', 'lost', 'archived'];

function tone(status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  if (status === 'won') return 'success';
  if (status === 'new') return 'warning';
  if (status === 'contacted' || status === 'quoted') return 'info';
  if (status === 'lost') return 'danger';
  return 'neutral';
}

export function QuotesView() {
  const { language } = useLanguage();
  const [rows, setRows] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<QuoteRequest | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const { data, error: e } = await supabase.from('frankiflow_quote_requests').select('*').order('created_at', { ascending: false });
    if (e) setError(e.message); else setRows((data ?? []) as QuoteRequest[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase.channel('flow-quotes-mobile').on('postgres_changes', { event: '*', schema: 'public', table: 'frankiflow_quote_requests' }, load).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const filtered = useMemo(() => filter === 'all' ? rows : rows.filter((r) => r.status === filter), [rows, filter]);

  function open(row: QuoteRequest) {
    setSelected(row); setNote(row.internal_note ?? '');
  }

  async function saveChanges(nextStatus?: string) {
    if (!selected) return;
    setSaving(true); setError(null);
    const payload: Record<string, any> = { internal_note: note };
    if (nextStatus) payload.status = nextStatus;
    const { data, error: e } = await supabase.from('frankiflow_quote_requests').update(payload).eq('id', selected.id).select().single();
    setSaving(false);
    if (e) { setError(e.message); return; }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSelected(data as QuoteRequest);
    await load();
  }

  if (loading) return <LoadingBlock />;

  return (
    <View>
      <ErrorBanner message={error} />
      <Segments
        value={filter}
        onChange={setFilter}
        items={['all', ...statuses].map((s) => ({ key: s, label: s === 'all' ? (language === 'de' ? 'Alle' : 'All') : titleCase(s) }))}
      />
      {filtered.length === 0 ? <EmptyState title={language === 'de' ? 'Keine Anfragen' : 'No quote requests'} /> : filtered.map((row) => (
        <Pressable key={row.id} onPress={() => open(row)}>
          <Card style={styles.card}>
            <View style={styles.topRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{row.customer_name}</Text>
                <Text style={styles.company}>{row.company_name || row.customer_email}</Text>
              </View>
              <Badge text={titleCase(row.status)} tone={tone(row.status)} />
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detail}>{titleCase(row.service_key)}</Text>
              <Text style={styles.detail}>{row.area_sqm ? `${row.area_sqm} m²` : '—'}</Text>
              <Text style={styles.amount}>{row.estimated_monthly != null ? euro(row.estimated_monthly) : '—'}</Text>
            </View>
            <Text style={styles.date}>{shortDateTime(row.created_at)}</Text>
          </Card>
        </Pressable>
      ))}

      <ModalSheet visible={Boolean(selected)} title={selected ? selected.customer_name : ''} onClose={() => setSelected(null)}>
        {selected ? (
          <>
            <Card>
              <KeyValue label="Status" value={<Badge text={titleCase(selected.status)} tone={tone(selected.status)} />} />
              <KeyValue label={language === 'de' ? 'Leistung' : 'Service'} value={titleCase(selected.service_key)} />
              <KeyValue label="E-Mail" value={selected.customer_email} />
              <KeyValue label={language === 'de' ? 'Telefon' : 'Phone'} value={selected.customer_phone || '—'} />
              <KeyValue label={language === 'de' ? 'Firma' : 'Company'} value={selected.company_name || '—'} />
              <KeyValue label={language === 'de' ? 'PLZ' : 'Postcode'} value={selected.postcode || '—'} />
              <KeyValue label={language === 'de' ? 'Fläche' : 'Area'} value={selected.area_sqm ? `${selected.area_sqm} m²` : '—'} />
              <KeyValue label={language === 'de' ? 'Fenster' : 'Windows'} value={selected.window_sqm ? `${selected.window_sqm} m²` : '—'} />
              <KeyValue label={language === 'de' ? 'Frequenz' : 'Frequency'} value={titleCase(selected.frequency_key)} />
              <KeyValue label={language === 'de' ? 'Laufzeit' : 'Contract'} value={selected.contract_months ? `${selected.contract_months} months` : '—'} />
              <KeyValue label={language === 'de' ? 'Grundreinigung' : 'Deep clean'} value={selected.deep_cleaning ? '✓' : '—'} />
              <KeyValue label={language === 'de' ? 'Material von uns' : 'Our equipment'} value={selected.equipment_by_frankiflow ? '✓' : '—'} />
              <KeyValue label={language === 'de' ? 'Schätzung' : 'Estimate'} value={selected.estimated_monthly != null ? euro(selected.estimated_monthly) : '—'} />
              <KeyValue label={language === 'de' ? 'Erstellt' : 'Created'} value={shortDateTime(selected.created_at)} />
            </Card>
            {selected.message ? <Card><Text style={styles.modalLabel}>{language === 'de' ? 'Kundennachricht' : 'Customer message'}</Text><Text style={styles.message}>{selected.message}</Text></Card> : null}
            <View style={styles.actions}>
              {selected.customer_phone ? <Button compact variant="secondary" title={language === 'de' ? 'Anrufen' : 'Call'} onPress={() => Linking.openURL(`tel:${selected.customer_phone}`)} /> : null}
              {selected.customer_email ? <Button compact variant="secondary" title="E-Mail" onPress={() => Linking.openURL(`mailto:${selected.customer_email}`)} /> : null}
            </View>
            <FormField label={language === 'de' ? 'Interne Notiz' : 'Internal note'} value={note} onChangeText={setNote} multiline />
            <Button title={language === 'de' ? 'Notiz speichern' : 'Save note'} onPress={() => saveChanges()} loading={saving} />
            <Text style={styles.modalLabel}>{language === 'de' ? 'Status ändern' : 'Change status'}</Text>
            <View style={styles.statusGrid}>
              {statuses.map((s) => <Button key={s} compact variant={s === selected.status ? 'primary' : 'secondary'} title={titleCase(s)} onPress={() => saveChanges(s)} disabled={saving} />)}
            </View>
          </>
        ) : null}
      </ModalSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14, marginBottom: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { color: colors.text, fontSize: 15, fontWeight: '900' },
  company: { color: colors.muted, fontSize: 12, marginTop: 3 },
  detailRow: { flexDirection: 'row', gap: 8, marginTop: 13, alignItems: 'center' },
  detail: { color: colors.muted, fontSize: 11, backgroundColor: colors.surfaceAlt, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  amount: { marginLeft: 'auto', color: colors.text, fontWeight: '900', fontSize: 13 },
  date: { color: colors.muted, fontSize: 10, marginTop: 9 },
  modalLabel: { color: colors.text, fontSize: 13, fontWeight: '900', marginTop: 18, marginBottom: 8 },
  message: { color: colors.text, fontSize: 14, lineHeight: 21 },
  actions: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
