import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Badge, Button, Card, EmptyState, ErrorBanner, FormField, KeyValue, LoadingBlock, ModalSheet, Segments, ToggleRow } from '../../components/ui';
import { useLanguage } from '../../context/LanguageContext';
import { euro, shortDateTime, titleCase, safeNumber } from '../../lib/format';
import { supabase } from '../../lib/supabase';
import { colors, spacing } from '../../theme';
import type { ChecklistItem, FlowClient, FlowEmployee, FlowJob } from '../../types';

const jobStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];

function statusTone(s: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  if (s === 'completed') return 'success';
  if (s === 'in_progress') return 'info';
  if (s === 'cancelled') return 'danger';
  return 'warning';
}

function parseDateTime(value: string) {
  // Accepts YYYY-MM-DD HH:MM in device local time, or a normal ISO string.
  const normalized = value.trim().replace(' ', 'T');
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function JobsView() {
  const { language } = useLanguage();
  const [jobs, setJobs] = useState<FlowJob[]>([]);
  const [clients, setClients] = useState<FlowClient[]>([]);
  const [employees, setEmployees] = useState<FlowEmployee[]>([]);
  const [filter, setFilter] = useState('open');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FlowJob | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [serviceKey, setServiceKey] = useState('general_cleaning');
  const [street, setStreet] = useState('');
  const [postcode, setPostcode] = useState('');
  const [city, setCity] = useState('Frankfurt am Main');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [clientId, setClientId] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [rate, setRate] = useState('22');
  const [hours, setHours] = useState('');
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    setError(null);
    const [j, c, e] = await Promise.all([
      supabase.from('frankiflow_jobs').select('*, frankiflow_clients(customer_name,company_name), frankiflow_employees(full_name)').order('starts_at', { ascending: true }),
      supabase.from('frankiflow_clients').select('*').eq('active', true).order('customer_name'),
      supabase.from('frankiflow_employees').select('*').eq('active', true).order('full_name'),
    ]);
    if (j.error || c.error || e.error) setError(j.error?.message ?? c.error?.message ?? e.error?.message ?? 'Load failed');
    setJobs((j.data ?? []) as FlowJob[]); setClients((c.data ?? []) as FlowClient[]); setEmployees((e.data ?? []) as FlowEmployee[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    if (filter === 'all') return jobs;
    if (filter === 'open') return jobs.filter((x) => ['scheduled', 'in_progress'].includes(x.status));
    return jobs.filter((x) => x.status === filter);
  }, [jobs, filter]);

  async function openJob(job: FlowJob) {
    setSelected(job); setNewItem('');
    const { data, error: e } = await supabase.from('frankiflow_job_checklist_items').select('*').eq('job_id', job.id).order('sort_order');
    if (e) setError(e.message); else setChecklist((data ?? []) as ChecklistItem[]);
  }

  async function createJob() {
    const starts = parseDateTime(start);
    const ends = end.trim() ? parseDateTime(end) : null;
    if (!title.trim() || !starts) { setError(language === 'de' ? 'Titel und gültige Startzeit sind erforderlich.' : 'Title and a valid start time are required.'); return; }
    setSaving(true); setError(null);
    const { data, error: e } = await supabase.from('frankiflow_jobs').insert({
      title: title.trim(), service_key: serviceKey.trim() || 'general_cleaning', street: street.trim(), postcode: postcode.trim(), city: city.trim(),
      starts_at: starts, ends_at: ends, client_id: clientId, assigned_employee_id: employeeId, billing_mode: 'hourly',
      agreed_rate: safeNumber(rate), estimated_hours: safeNumber(hours), internal_note: note.trim(),
    }).select().single();
    setSaving(false);
    if (e) { setError(e.message); return; }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNewOpen(false); resetForm(); await load();
    if (data) openJob(data as FlowJob);
  }

  function resetForm() {
    setTitle(''); setServiceKey('general_cleaning'); setStreet(''); setPostcode(''); setCity('Frankfurt am Main'); setStart(''); setEnd(''); setClientId(null); setEmployeeId(null); setRate('22'); setHours(''); setNote('');
  }

  async function changeStatus(status: string) {
    if (!selected) return;
    setSaving(true);
    const { data, error: e } = await supabase.from('frankiflow_jobs').update({ status }).eq('id', selected.id).select('*, frankiflow_clients(customer_name,company_name), frankiflow_employees(full_name)').single();
    setSaving(false);
    if (e) { setError(e.message); return; }
    setSelected(data as FlowJob); await load();
  }

  async function addChecklist() {
    if (!selected || !newItem.trim()) return;
    const sort = checklist.length ? Math.max(...checklist.map((x) => x.sort_order)) + 1 : 1;
    const { data, error: e } = await supabase.from('frankiflow_job_checklist_items').insert({ job_id: selected.id, label: newItem.trim(), sort_order: sort }).select().single();
    if (e) { setError(e.message); return; }
    setChecklist((prev) => [...prev, data as ChecklistItem]); setNewItem('');
  }

  async function toggleChecklist(item: ChecklistItem, field: 'completed' | 'inspector_checked', value: boolean) {
    const patch = field === 'completed'
      ? { completed: value, completed_at: value ? new Date().toISOString() : null }
      : { inspector_checked: value, inspector_checked_at: value ? new Date().toISOString() : null };
    const { data, error: e } = await supabase.from('frankiflow_job_checklist_items').update(patch).eq('id', item.id).select().single();
    if (e) { setError(e.message); return; }
    setChecklist((prev) => prev.map((x) => x.id === item.id ? data as ChecklistItem : x));
  }

  async function removeItem(item: ChecklistItem) {
    Alert.alert(language === 'de' ? 'Punkt löschen?' : 'Delete item?', item.label, [
      { text: language === 'de' ? 'Abbrechen' : 'Cancel', style: 'cancel' },
      { text: language === 'de' ? 'Löschen' : 'Delete', style: 'destructive', onPress: async () => {
        const { error: e } = await supabase.from('frankiflow_job_checklist_items').delete().eq('id', item.id);
        if (e) setError(e.message); else setChecklist((prev) => prev.filter((x) => x.id !== item.id));
      } },
    ]);
  }

  if (loading) return <LoadingBlock />;

  return (
    <View>
      <ErrorBanner message={error} />
      <View style={styles.headerActions}><Button compact title={language === 'de' ? '+ Auftrag' : '+ Job'} onPress={() => setNewOpen(true)} /></View>
      <Segments value={filter} onChange={setFilter} items={['open','scheduled','in_progress','completed','cancelled','all'].map((s) => ({ key: s, label: s === 'open' ? (language === 'de' ? 'Offen' : 'Open') : s === 'all' ? (language === 'de' ? 'Alle' : 'All') : titleCase(s) }))} />
      {visible.length === 0 ? <EmptyState title={language === 'de' ? 'Keine Aufträge' : 'No jobs'} message={language === 'de' ? 'Erstelle den ersten Reinigungstermin direkt in der App.' : 'Create the first cleaning visit directly in the app.'} /> : visible.map((job) => (
        <Pressable key={job.id} onPress={() => openJob(job)}>
          <Card style={styles.jobCard}>
            <View style={styles.topRow}>
              <View style={{ flex: 1 }}><Text style={styles.title}>{job.title}</Text><Text style={styles.sub}>{job.frankiflow_clients?.company_name || job.frankiflow_clients?.customer_name || titleCase(job.service_key)}</Text></View>
              <Badge text={titleCase(job.status)} tone={statusTone(job.status)} />
            </View>
            <Text style={styles.date}>{shortDateTime(job.starts_at)}{job.ends_at ? ` → ${shortDateTime(job.ends_at)}` : ''}</Text>
            <View style={styles.bottomRow}><Text style={styles.employee}>{job.frankiflow_employees?.full_name || (language === 'de' ? 'Nicht zugewiesen' : 'Unassigned')}</Text><Text style={styles.rate}>{job.agreed_rate != null ? `${euro(job.agreed_rate)}/h` : '—'}</Text></View>
          </Card>
        </Pressable>
      ))}

      <ModalSheet visible={newOpen} title={language === 'de' ? 'Neuer Auftrag' : 'New job'} onClose={() => { setNewOpen(false); resetForm(); }}>
        <ErrorBanner message={error} />
        <FormField label={language === 'de' ? 'Titel *' : 'Title *'} value={title} onChangeText={setTitle} placeholder="Büroreinigung · Kunde" />
        <FormField label={language === 'de' ? 'Leistung' : 'Service'} value={serviceKey} onChangeText={setServiceKey} placeholder="buero" />
        <Text style={styles.fieldTitle}>{language === 'de' ? 'Kunde' : 'Client'}</Text>
        <View style={styles.choiceWrap}><Pressable onPress={() => setClientId(null)} style={[styles.choice, !clientId && styles.choiceActive]}><Text style={[styles.choiceText, !clientId && styles.choiceTextActive]}>—</Text></Pressable>{clients.map((c) => <Pressable key={c.id} onPress={() => setClientId(c.id)} style={[styles.choice, clientId === c.id && styles.choiceActive]}><Text numberOfLines={1} style={[styles.choiceText, clientId === c.id && styles.choiceTextActive]}>{c.company_name || c.customer_name}</Text></Pressable>)}</View>
        <Text style={styles.fieldTitle}>{language === 'de' ? 'Mitarbeiter' : 'Employee'}</Text>
        <View style={styles.choiceWrap}><Pressable onPress={() => setEmployeeId(null)} style={[styles.choice, !employeeId && styles.choiceActive]}><Text style={[styles.choiceText, !employeeId && styles.choiceTextActive]}>—</Text></Pressable>{employees.map((e) => <Pressable key={e.id} onPress={() => setEmployeeId(e.id)} style={[styles.choice, employeeId === e.id && styles.choiceActive]}><Text style={[styles.choiceText, employeeId === e.id && styles.choiceTextActive]}>{e.full_name}</Text></Pressable>)}</View>
        <FormField label={language === 'de' ? 'Straße' : 'Street'} value={street} onChangeText={setStreet} />
        <View style={styles.two}><View style={{ flex: 1 }}><FormField label="PLZ" value={postcode} onChangeText={setPostcode} /></View><View style={{ flex: 2 }}><FormField label={language === 'de' ? 'Stadt' : 'City'} value={city} onChangeText={setCity} /></View></View>
        <FormField label={language === 'de' ? 'Start * (YYYY-MM-DD HH:MM)' : 'Start * (YYYY-MM-DD HH:MM)'} value={start} onChangeText={setStart} placeholder="2026-09-15 09:00" />
        <FormField label={language === 'de' ? 'Ende (YYYY-MM-DD HH:MM)' : 'End (YYYY-MM-DD HH:MM)'} value={end} onChangeText={setEnd} placeholder="2026-09-15 12:00" />
        <View style={styles.two}><View style={{ flex: 1 }}><FormField label={language === 'de' ? '€/Std.' : '€/hour'} keyboardType="decimal-pad" value={rate} onChangeText={setRate} /></View><View style={{ flex: 1 }}><FormField label={language === 'de' ? 'Std. geplant' : 'Est. hours'} keyboardType="decimal-pad" value={hours} onChangeText={setHours} /></View></View>
        <FormField label={language === 'de' ? 'Interne Notiz' : 'Internal note'} value={note} onChangeText={setNote} multiline />
        <Button title={language === 'de' ? 'Auftrag erstellen' : 'Create job'} onPress={createJob} loading={saving} />
      </ModalSheet>

      <ModalSheet visible={Boolean(selected)} title={selected?.title ?? ''} onClose={() => { setSelected(null); setChecklist([]); }}>
        {selected ? <>
          <Card>
            <KeyValue label="Status" value={<Badge text={titleCase(selected.status)} tone={statusTone(selected.status)} />} />
            <KeyValue label={language === 'de' ? 'Kunde' : 'Client'} value={selected.frankiflow_clients?.company_name || selected.frankiflow_clients?.customer_name || '—'} />
            <KeyValue label={language === 'de' ? 'Mitarbeiter' : 'Employee'} value={selected.frankiflow_employees?.full_name || '—'} />
            <KeyValue label="Start" value={shortDateTime(selected.starts_at)} />
            <KeyValue label={language === 'de' ? 'Ende' : 'End'} value={shortDateTime(selected.ends_at)} />
            <KeyValue label={language === 'de' ? 'Adresse' : 'Address'} value={[selected.street, selected.postcode, selected.city].filter(Boolean).join(', ') || '—'} />
            <KeyValue label={language === 'de' ? 'Preis' : 'Rate'} value={selected.agreed_rate != null ? `${euro(selected.agreed_rate)}/h` : '—'} />
            <KeyValue label={language === 'de' ? 'Geplante Std.' : 'Est. hours'} value={selected.estimated_hours ?? '—'} />
          </Card>
          {selected.internal_note ? <Card><Text style={styles.fieldTitle}>{language === 'de' ? 'Interne Notiz' : 'Internal note'}</Text><Text style={styles.note}>{selected.internal_note}</Text></Card> : null}
          <Text style={styles.fieldTitle}>{language === 'de' ? 'Status' : 'Status'}</Text>
          <View style={styles.choiceWrap}>{jobStatuses.map((s) => <Button key={s} compact variant={s === selected.status ? 'primary' : 'secondary'} title={titleCase(s)} onPress={() => changeStatus(s)} loading={saving && s === selected.status} />)}</View>
          <View style={styles.checkHeader}><Text style={styles.checkTitle}>{language === 'de' ? 'Reinigungsnachweis / Checkliste' : 'Cleaning proof / checklist'}</Text><Badge text={`${checklist.filter(x=>x.completed).length}/${checklist.length}`} tone={checklist.length && checklist.every(x=>x.completed) ? 'success' : 'neutral'} /></View>
          {checklist.map((item) => <Card key={item.id} style={styles.checkCard}>
            <ToggleRow label={item.label} value={item.completed} onValueChange={(v) => toggleChecklist(item, 'completed', v)} description={language === 'de' ? 'Durch Mitarbeiter erledigt' : 'Completed by cleaner'} />
            <ToggleRow label={language === 'de' ? 'Kontrolliert' : 'Inspected'} value={item.inspector_checked} onValueChange={(v) => toggleChecklist(item, 'inspector_checked', v)} description={language === 'de' ? 'Von dir / Manager kontrolliert' : 'Checked by owner / manager'} />
            <Pressable onPress={() => removeItem(item)}><Text style={styles.remove}>{language === 'de' ? 'Punkt löschen' : 'Delete item'}</Text></Pressable>
          </Card>)}
          <FormField label={language === 'de' ? 'Checklistenpunkt hinzufügen' : 'Add checklist item'} value={newItem} onChangeText={setNewItem} placeholder={language === 'de' ? 'z. B. Sanitärbereich reinigen' : 'e.g. Clean sanitary area'} />
          <Button variant="secondary" title={language === 'de' ? '+ Punkt hinzufügen' : '+ Add item'} onPress={addChecklist} />
        </> : null}
      </ModalSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  headerActions: { alignItems: 'flex-end', marginBottom: 10 },
  jobCard: { padding: 14, marginBottom: 10 },
  topRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  title: { color: colors.text, fontSize: 15, fontWeight: '900' },
  sub: { color: colors.muted, fontSize: 12, marginTop: 3 },
  date: { color: colors.text, fontWeight: '700', fontSize: 12, marginTop: 13 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  employee: { color: colors.muted, fontSize: 11 },
  rate: { color: colors.primary, fontWeight: '900', fontSize: 12 },
  fieldTitle: { color: colors.text, fontSize: 13, fontWeight: '900', marginBottom: 8, marginTop: 4 },
  choiceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: spacing.md },
  choice: { maxWidth: '100%', paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  choiceActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  choiceText: { color: colors.text, fontWeight: '700', fontSize: 12, maxWidth: 180 },
  choiceTextActive: { color: colors.white },
  two: { flexDirection: 'row', gap: 10 },
  note: { color: colors.text, fontSize: 13, lineHeight: 20 },
  checkHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 10 },
  checkTitle: { color: colors.text, fontSize: 16, fontWeight: '900', flex: 1 },
  checkCard: { paddingVertical: 9 },
  remove: { color: colors.danger, fontWeight: '800', fontSize: 11, marginTop: 6 },
});
