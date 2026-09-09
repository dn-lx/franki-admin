import React, { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge, Button, Card, EmptyState, ErrorBanner, FormField, LoadingBlock, Segments, ToggleRow } from '../../components/ui';
import { useLanguage } from '../../context/LanguageContext';
import { euro, safeNumber, shortDateTime, titleCase } from '../../lib/format';
import { supabase } from '../../lib/supabase';
import { colors, spacing } from '../../theme';
import type { FlowPayment } from '../../types';

type Mode = 'payments' | 'calculator';
type ConfigMap = Record<string, any>;

export function BusinessView() {
  const { language } = useLanguage();
  const [mode, setMode] = useState<Mode>('payments');
  const [payments, setPayments] = useState<FlowPayment[]>([]);
  const [config, setConfig] = useState<ConfigMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [p, cfg] = await Promise.all([
      supabase.from('frankiflow_payments').select('*').order('created_at', { ascending: false }),
      supabase.functions.invoke('pricing-admin', { body: { action: 'get_config' } }),
    ]);
    if (p.error) setError(p.error.message); else setPayments((p.data ?? []) as FlowPayment[]);
    if (cfg.error || cfg.data?.error) setError(cfg.error?.message ?? cfg.data?.error ?? 'Could not load calculator settings');
    else {
      const next: ConfigMap = {};
      for (const row of cfg.data?.config ?? []) next[row.key] = row.value;
      setConfig(next);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function patch(key: string, path: string[], value: any) {
    setConfig((prev) => {
      const root = JSON.parse(JSON.stringify(prev[key] ?? {}));
      let target = root;
      for (let i = 0; i < path.length - 1; i += 1) {
        const part = path[i]!;
        target[part] = target[part] ?? {};
        target = target[part];
      }
      target[path[path.length - 1]!] = value;
      return { ...prev, [key]: root };
    });
  }

  async function saveConfig() {
    setSaving(true); setError(null); setSuccess(null);
    const { data, error: e } = await supabase.functions.invoke('pricing-admin', { body: { action: 'save_config', config } });
    setSaving(false);
    if (e || data?.error) setError(e?.message ?? data?.error ?? 'Save failed');
    else setSuccess(language === 'de' ? 'Preise wurden gespeichert.' : 'Pricing was saved.');
  }

  if (loading) return <LoadingBlock />;
  const services = config.service_settings?.services ?? {};

  return <View>
    <ErrorBanner message={error} />
    {success ? <View style={styles.success}><Text style={styles.successText}>{success}</Text></View> : null}
    <Segments value={mode} onChange={(x) => setMode(x as Mode)} items={[{ key: 'payments', label: language === 'de' ? 'Zahlungen' : 'Payments' }, { key: 'calculator', label: language === 'de' ? 'Preisrechner' : 'Calculator' }]} />

    {mode === 'payments' ? <>
      {payments.length === 0 ? <EmptyState title={language === 'de' ? 'Noch keine FrankiFlow-Zahlungen' : 'No FrankiFlow payments yet'} /> : payments.map((p) => <Card key={p.id} style={styles.payCard}>
        <View style={styles.row}><View style={{ flex: 1 }}><Text style={styles.name}>{p.description}</Text><Text style={styles.sub}>{p.customer_email} · {shortDateTime(p.created_at)}</Text></View><View style={{ alignItems: 'flex-end', gap: 5 }}><Text style={styles.amount}>{euro(p.amount_cents, true)}</Text><Badge text={titleCase(p.status)} tone={p.status === 'paid' ? 'success' : p.status === 'failed' ? 'danger' : p.status === 'checkout_open' ? 'info' : 'neutral'} /></View></View>
        {p.checkout_url ? <Pressable onPress={() => Linking.openURL(p.checkout_url!)}><Text style={styles.link}>{language === 'de' ? 'Checkout öffnen' : 'Open checkout'} ↗</Text></Pressable> : null}
      </Card>)}
    </> : <>
      <Card>
        <Text style={styles.cardTitle}>{language === 'de' ? 'Grundpreise' : 'Base prices'}</Text>
        <Text style={styles.help}>{language === 'de' ? 'Diese Werte steuern den bestehenden FrankiFlow Preisrechner.' : 'These values control the existing FrankiFlow price calculator.'}</Text>
        {Object.entries(services).map(([key, value]: [string, any]) => <View key={key} style={styles.serviceRow}>
          <View style={{ flex: 1 }}><Text style={styles.name}>{value.label ?? titleCase(key)}</Text><ToggleRow label={language === 'de' ? 'Aktiv' : 'Enabled'} value={Boolean(value.enabled)} onValueChange={(v) => patch('service_settings', ['services', key, 'enabled'], v)} /></View>
          <View style={{ width: 105 }}><FormField label="Base €" keyboardType="decimal-pad" value={String(value.base_1m ?? '')} onChangeText={(v) => patch('service_settings', ['services', key, 'base_1m'], safeNumber(v) ?? 0)} /></View>
        </View>)}
        <FormField label={language === 'de' ? 'Mindestpreis pro Reinigung €' : 'Minimum cleaning charge €'} keyboardType="decimal-pad" value={String(config.service_settings?.minimum_cleaning_charge ?? '')} onChangeText={(v) => patch('service_settings', ['minimum_cleaning_charge'], safeNumber(v) ?? 0)} />
        <FormField label={language === 'de' ? 'Flächen-Gradient €/m²' : 'Area gradient €/m²'} keyboardType="decimal-pad" value={String(config.service_settings?.gradient_per_sqm ?? '')} onChangeText={(v) => patch('service_settings', ['gradient_per_sqm'], safeNumber(v) ?? 0)} />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>{language === 'de' ? 'Grundreinigung' : 'Deep cleaning'}</Text>
        <ToggleRow label={language === 'de' ? 'Aktiv' : 'Enabled'} value={Boolean(config.deep_cleaning_settings?.enabled)} onValueChange={(v) => patch('deep_cleaning_settings', ['enabled'], v)} />
        <FormField label={language === 'de' ? 'Aufschlag %' : 'Surcharge %'} keyboardType="decimal-pad" value={String(config.deep_cleaning_settings?.surcharge_pct ?? '')} onChangeText={(v) => patch('deep_cleaning_settings', ['surcharge_pct'], safeNumber(v) ?? 0)} />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>{language === 'de' ? 'Neukunden-Angebot' : 'New-customer offer'}</Text>
        <ToggleRow label={language === 'de' ? 'Rabatt aktiv' : 'Discount enabled'} value={Boolean(config.promotion_settings?.enabled)} onValueChange={(v) => patch('promotion_settings', ['enabled'], v)} />
        <FormField label={language === 'de' ? 'Rabatt im ersten Monat %' : 'First-month discount %'} keyboardType="decimal-pad" value={String(config.promotion_settings?.first_month_discount_pct ?? '')} onChangeText={(v) => patch('promotion_settings', ['first_month_discount_pct'], safeNumber(v) ?? 0)} />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>{language === 'de' ? 'Fenster & Material' : 'Windows & equipment'}</Text>
        <ToggleRow label={language === 'de' ? 'Fensterpreis aktiv' : 'Window pricing enabled'} value={Boolean(config.window_settings?.enabled)} onValueChange={(v) => patch('window_settings', ['enabled'], v)} />
        <FormField label={language === 'de' ? 'Fenster Mindestpreis €' : 'Window minimum €'} keyboardType="decimal-pad" value={String(config.window_settings?.minimum ?? '')} onChangeText={(v) => patch('window_settings', ['minimum'], safeNumber(v) ?? 0)} />
        <FormField label={language === 'de' ? 'Fenster Gradient €/m²' : 'Window gradient €/m²'} keyboardType="decimal-pad" value={String(config.window_settings?.gradient_per_sqm ?? '')} onChangeText={(v) => patch('window_settings', ['gradient_per_sqm'], safeNumber(v) ?? 0)} />
        <ToggleRow label={language === 'de' ? 'Materialaufschlag aktiv' : 'Equipment surcharge enabled'} value={Boolean(config.equipment_settings?.enabled)} onValueChange={(v) => patch('equipment_settings', ['enabled'], v)} />
        <FormField label={language === 'de' ? 'Material Basis €' : 'Equipment base €'} keyboardType="decimal-pad" value={String(config.equipment_settings?.base ?? '')} onChangeText={(v) => patch('equipment_settings', ['base'], safeNumber(v) ?? 0)} />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>{language === 'de' ? 'MwSt.' : 'VAT'}</Text>
        <ToggleRow label={language === 'de' ? 'MwSt. aktiviert' : 'VAT enabled'} value={Boolean(config.vat_settings?.enabled)} onValueChange={(v) => patch('vat_settings', ['enabled'], v)} />
        <FormField label={language === 'de' ? 'MwSt. %' : 'VAT %'} keyboardType="decimal-pad" value={String(config.vat_settings?.rate_pct ?? '')} onChangeText={(v) => patch('vat_settings', ['rate_pct'], safeNumber(v) ?? 0)} />
      </Card>
      <Button title={language === 'de' ? 'Preisrechner speichern' : 'Save calculator settings'} onPress={saveConfig} loading={saving} />
    </>}
  </View>;
}

const styles = StyleSheet.create({
  success: { padding: 12, backgroundColor: colors.successSoft, borderRadius: 10, marginBottom: 12 },
  successText: { color: colors.success, fontWeight: '800', fontSize: 12 },
  payCard: { padding: 14, marginBottom: 9 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  name: { color: colors.text, fontWeight: '900', fontSize: 14 },
  sub: { color: colors.muted, fontSize: 11, marginTop: 3 },
  amount: { color: colors.text, fontWeight: '900', fontSize: 14 },
  link: { color: colors.primary, fontWeight: '800', fontSize: 12, marginTop: 10 },
  cardTitle: { color: colors.text, fontWeight: '900', fontSize: 16, marginBottom: 5 },
  help: { color: colors.muted, fontSize: 12, lineHeight: 17, marginBottom: spacing.md },
  serviceRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, paddingTop: 8 },
});
