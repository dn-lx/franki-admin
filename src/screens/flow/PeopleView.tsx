import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge, Button, Card, EmptyState, ErrorBanner, FormField, KeyValue, LoadingBlock, ModalSheet, Segments, ToggleRow } from '../../components/ui';
import { useLanguage } from '../../context/LanguageContext';
import { euro, safeNumber, titleCase } from '../../lib/format';
import { supabase } from '../../lib/supabase';
import { colors, spacing } from '../../theme';
import type { FlowClient, FlowEmployee } from '../../types';

type Mode = 'clients' | 'employees';

export function PeopleView() {
  const { language } = useLanguage();
  const [mode, setMode] = useState<Mode>('clients');
  const [clients, setClients] = useState<FlowClient[]>([]);
  const [employees, setEmployees] = useState<FlowEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientEdit, setClientEdit] = useState<Partial<FlowClient> | null>(null);
  const [employeeEdit, setEmployeeEdit] = useState<Partial<FlowEmployee> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const [c, e] = await Promise.all([
      supabase.from('frankiflow_clients').select('*').order('active', { ascending: false }).order('customer_name'),
      supabase.from('frankiflow_employees').select('*').order('active', { ascending: false }).order('full_name'),
    ]);
    if (c.error || e.error) setError(c.error?.message ?? e.error?.message ?? 'Load failed');
    setClients((c.data ?? []) as FlowClient[]); setEmployees((e.data ?? []) as FlowEmployee[]); setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function newClient() {
    setClientEdit({ client_type: 'private', customer_name: '', company_name: '', email: '', phone: '', street: '', postcode: '', city: 'Frankfurt am Main', notes: '', active: true });
  }
  function newEmployee() {
    setEmployeeEdit({ full_name: '', email: '', phone: '', role: 'cleaner', employment_type: 'minijob', hourly_rate: 13.9, active: true, notes: '' });
  }

  async function saveClient() {
    if (!clientEdit?.customer_name?.trim()) { setError(language === 'de' ? 'Kundenname ist erforderlich.' : 'Client name is required.'); return; }
    setSaving(true);
    const payload = {
      client_type: clientEdit.client_type ?? 'private', customer_name: clientEdit.customer_name.trim(), company_name: clientEdit.company_name ?? '', email: clientEdit.email ?? '', phone: clientEdit.phone ?? '',
      street: clientEdit.street ?? '', postcode: clientEdit.postcode ?? '', city: clientEdit.city ?? 'Frankfurt am Main', notes: clientEdit.notes ?? '', active: clientEdit.active ?? true,
    };
    const query = clientEdit.id ? supabase.from('frankiflow_clients').update(payload).eq('id', clientEdit.id) : supabase.from('frankiflow_clients').insert(payload);
    const { error: e } = await query;
    setSaving(false);
    if (e) setError(e.message); else { setClientEdit(null); await load(); }
  }

  async function saveEmployee() {
    if (!employeeEdit?.full_name?.trim()) { setError(language === 'de' ? 'Mitarbeitername ist erforderlich.' : 'Employee name is required.'); return; }
    setSaving(true);
    const payload = {
      full_name: employeeEdit.full_name.trim(), email: employeeEdit.email ?? '', phone: employeeEdit.phone ?? '', role: employeeEdit.role ?? 'cleaner', employment_type: employeeEdit.employment_type ?? 'minijob',
      hourly_rate: Number(employeeEdit.hourly_rate ?? 13.9), active: employeeEdit.active ?? true, notes: employeeEdit.notes ?? '',
    };
    const query = employeeEdit.id ? supabase.from('frankiflow_employees').update(payload).eq('id', employeeEdit.id) : supabase.from('frankiflow_employees').insert(payload);
    const { error: e } = await query;
    setSaving(false);
    if (e) setError(e.message); else { setEmployeeEdit(null); await load(); }
  }

  if (loading) return <LoadingBlock />;

  return <View>
    <ErrorBanner message={error} />
    <Segments value={mode} onChange={(x) => setMode(x as Mode)} items={[{ key: 'clients', label: language === 'de' ? 'Kunden' : 'Clients' }, { key: 'employees', label: language === 'de' ? 'Mitarbeiter' : 'Employees' }]} />
    <View style={styles.action}><Button compact title={mode === 'clients' ? (language === 'de' ? '+ Kunde' : '+ Client') : (language === 'de' ? '+ Mitarbeiter' : '+ Employee')} onPress={mode === 'clients' ? newClient : newEmployee} /></View>

    {mode === 'clients' ? <>
      {clients.length === 0 ? <EmptyState title={language === 'de' ? 'Noch keine Kunden' : 'No clients yet'} /> : clients.map((c) => <Pressable key={c.id} onPress={() => setClientEdit(c)}><Card style={styles.rowCard}>
        <View style={styles.row}><View style={{ flex: 1 }}><Text style={styles.name}>{c.company_name || c.customer_name}</Text><Text style={styles.sub}>{c.company_name ? c.customer_name : titleCase(c.client_type)} · {c.city || '—'}</Text></View><Badge text={c.active ? (language === 'de' ? 'Aktiv' : 'Active') : (language === 'de' ? 'Inaktiv' : 'Inactive')} tone={c.active ? 'success' : 'neutral'} /></View>
      </Card></Pressable>)}
    </> : <>
      {employees.length === 0 ? <EmptyState title={language === 'de' ? 'Noch keine Mitarbeiter' : 'No employees yet'} /> : employees.map((e) => <Pressable key={e.id} onPress={() => setEmployeeEdit(e)}><Card style={styles.rowCard}>
        <View style={styles.row}><View style={{ flex: 1 }}><Text style={styles.name}>{e.full_name}</Text><Text style={styles.sub}>{titleCase(e.role)} · {titleCase(e.employment_type)}</Text></View><View style={{ alignItems: 'flex-end', gap: 5 }}><Badge text={e.active ? (language === 'de' ? 'Aktiv' : 'Active') : (language === 'de' ? 'Inaktiv' : 'Inactive')} tone={e.active ? 'success' : 'neutral'} /><Text style={styles.rate}>{euro(e.hourly_rate)}/h</Text></View></View>
      </Card></Pressable>)}
    </>}

    <ModalSheet visible={Boolean(clientEdit)} title={clientEdit?.id ? (language === 'de' ? 'Kunde bearbeiten' : 'Edit client') : (language === 'de' ? 'Neuer Kunde' : 'New client')} onClose={() => setClientEdit(null)}>
      {clientEdit ? <>
        <FormField label={language === 'de' ? 'Name *' : 'Name *'} value={clientEdit.customer_name ?? ''} onChangeText={(v) => setClientEdit({ ...clientEdit, customer_name: v })} />
        <FormField label={language === 'de' ? 'Firma' : 'Company'} value={clientEdit.company_name ?? ''} onChangeText={(v) => setClientEdit({ ...clientEdit, company_name: v })} />
        <Text style={styles.fieldTitle}>{language === 'de' ? 'Kundentyp' : 'Client type'}</Text>
        <View style={styles.choices}>{['private','business','airbnb','property_management','other'].map((x) => <Pressable key={x} onPress={() => setClientEdit({ ...clientEdit, client_type: x })} style={[styles.choice, clientEdit.client_type === x && styles.choiceActive]}><Text style={[styles.choiceText, clientEdit.client_type === x && styles.choiceTextActive]}>{titleCase(x)}</Text></Pressable>)}</View>
        <FormField label="E-Mail" autoCapitalize="none" keyboardType="email-address" value={clientEdit.email ?? ''} onChangeText={(v) => setClientEdit({ ...clientEdit, email: v })} />
        <FormField label={language === 'de' ? 'Telefon' : 'Phone'} keyboardType="phone-pad" value={clientEdit.phone ?? ''} onChangeText={(v) => setClientEdit({ ...clientEdit, phone: v })} />
        <FormField label={language === 'de' ? 'Straße' : 'Street'} value={clientEdit.street ?? ''} onChangeText={(v) => setClientEdit({ ...clientEdit, street: v })} />
        <View style={styles.two}><View style={{ flex: 1 }}><FormField label="PLZ" value={clientEdit.postcode ?? ''} onChangeText={(v) => setClientEdit({ ...clientEdit, postcode: v })} /></View><View style={{ flex: 2 }}><FormField label={language === 'de' ? 'Stadt' : 'City'} value={clientEdit.city ?? ''} onChangeText={(v) => setClientEdit({ ...clientEdit, city: v })} /></View></View>
        <FormField label={language === 'de' ? 'Notiz' : 'Notes'} value={clientEdit.notes ?? ''} onChangeText={(v) => setClientEdit({ ...clientEdit, notes: v })} multiline />
        <ToggleRow label={language === 'de' ? 'Aktiver Kunde' : 'Active client'} value={clientEdit.active ?? true} onValueChange={(v) => setClientEdit({ ...clientEdit, active: v })} />
        <Button title={language === 'de' ? 'Kunde speichern' : 'Save client'} onPress={saveClient} loading={saving} />
      </> : null}
    </ModalSheet>

    <ModalSheet visible={Boolean(employeeEdit)} title={employeeEdit?.id ? (language === 'de' ? 'Mitarbeiter bearbeiten' : 'Edit employee') : (language === 'de' ? 'Neuer Mitarbeiter' : 'New employee')} onClose={() => setEmployeeEdit(null)}>
      {employeeEdit ? <>
        <FormField label={language === 'de' ? 'Vollständiger Name *' : 'Full name *'} value={employeeEdit.full_name ?? ''} onChangeText={(v) => setEmployeeEdit({ ...employeeEdit, full_name: v })} />
        <FormField label="E-Mail" autoCapitalize="none" keyboardType="email-address" value={employeeEdit.email ?? ''} onChangeText={(v) => setEmployeeEdit({ ...employeeEdit, email: v })} />
        <FormField label={language === 'de' ? 'Telefon' : 'Phone'} keyboardType="phone-pad" value={employeeEdit.phone ?? ''} onChangeText={(v) => setEmployeeEdit({ ...employeeEdit, phone: v })} />
        <Text style={styles.fieldTitle}>{language === 'de' ? 'Rolle' : 'Role'}</Text><View style={styles.choices}>{['cleaner','inspector','manager','owner'].map((x) => <Pressable key={x} onPress={() => setEmployeeEdit({ ...employeeEdit, role: x })} style={[styles.choice, employeeEdit.role === x && styles.choiceActive]}><Text style={[styles.choiceText, employeeEdit.role === x && styles.choiceTextActive]}>{titleCase(x)}</Text></Pressable>)}</View>
        <Text style={styles.fieldTitle}>{language === 'de' ? 'Beschäftigung' : 'Employment'}</Text><View style={styles.choices}>{['minijob','part_time','full_time','contractor','owner'].map((x) => <Pressable key={x} onPress={() => setEmployeeEdit({ ...employeeEdit, employment_type: x })} style={[styles.choice, employeeEdit.employment_type === x && styles.choiceActive]}><Text style={[styles.choiceText, employeeEdit.employment_type === x && styles.choiceTextActive]}>{titleCase(x)}</Text></Pressable>)}</View>
        <FormField label={language === 'de' ? 'Stundenlohn €' : 'Hourly rate €'} keyboardType="decimal-pad" value={String(employeeEdit.hourly_rate ?? '')} onChangeText={(v) => setEmployeeEdit({ ...employeeEdit, hourly_rate: safeNumber(v) ?? 0 })} />
        <FormField label={language === 'de' ? 'Notiz' : 'Notes'} value={employeeEdit.notes ?? ''} onChangeText={(v) => setEmployeeEdit({ ...employeeEdit, notes: v })} multiline />
        <ToggleRow label={language === 'de' ? 'Aktiver Mitarbeiter' : 'Active employee'} value={employeeEdit.active ?? true} onValueChange={(v) => setEmployeeEdit({ ...employeeEdit, active: v })} />
        <Button title={language === 'de' ? 'Mitarbeiter speichern' : 'Save employee'} onPress={saveEmployee} loading={saving} />
      </> : null}
    </ModalSheet>
  </View>;
}

const styles = StyleSheet.create({
  action: { alignItems: 'flex-end', marginBottom: 10 },
  rowCard: { padding: 14, marginBottom: 9 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { color: colors.text, fontWeight: '900', fontSize: 15 },
  sub: { color: colors.muted, fontSize: 11, marginTop: 4 },
  rate: { color: colors.primary, fontWeight: '900', fontSize: 11 },
  fieldTitle: { color: colors.text, fontSize: 13, fontWeight: '900', marginBottom: 8 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: spacing.md },
  choice: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  choiceActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  choiceText: { color: colors.text, fontWeight: '700', fontSize: 11 },
  choiceTextActive: { color: colors.white },
  two: { flexDirection: 'row', gap: 10 },
});
