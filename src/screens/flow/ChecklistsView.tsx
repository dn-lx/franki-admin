import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, ErrorBanner, FormField, LoadingBlock, Segments, ToggleRow } from '../../components/ui';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabase';
import { colors, radius, spacing } from '../../theme';

type ChecklistItem = { de: string; en: string };
type ChecklistSection = { title_de: string; title_en: string; optional: boolean; items: ChecklistItem[] };
type ChecklistRow = { service_key: string; label_de: string; label_en: string; sections: ChecklistSection[]; updated_at?: string };

const order = ['buero', 'wohnung', 'airbnb', 'treppenhaus', 'deep', 'windows'];

function normaliseSections(value: unknown): ChecklistSection[] {
  if (!Array.isArray(value)) return [];
  return value.map((section: any) => ({
    title_de: String(section?.title_de ?? ''),
    title_en: String(section?.title_en ?? ''),
    optional: Boolean(section?.optional),
    items: Array.isArray(section?.items)
      ? section.items.map((item: any) => ({ de: String(item?.de ?? ''), en: String(item?.en ?? '') }))
      : [],
  }));
}

export function ChecklistsView() {
  const { language } = useLanguage();
  const de = language === 'de';
  const [rows, setRows] = useState<ChecklistRow[]>([]);
  const [activeKey, setActiveKey] = useState('buero');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: e } = await supabase
      .from('frankiflow_checklists')
      .select('service_key,label_de,label_en,sections,updated_at');
    if (e) setError(e.message);
    else {
      const next = ((data ?? []) as any[])
        .map((row) => ({ ...row, sections: normaliseSections(row.sections) } as ChecklistRow))
        .sort((a, b) => order.indexOf(a.service_key) - order.indexOf(b.service_key));
      setRows(next);
      const first = next[0];
      if (first && !next.some((x) => x.service_key === activeKey)) setActiveKey(first.service_key);
    }
    setLoading(false);
  }, [activeKey]);

  useEffect(() => { load(); }, [load]);

  const active = useMemo(() => rows.find((x) => x.service_key === activeKey) ?? null, [rows, activeKey]);

  function patchActive(mutator: (draft: ChecklistRow) => void) {
    setRows((prev) => prev.map((row) => {
      if (row.service_key !== activeKey) return row;
      const draft: ChecklistRow = {
        ...row,
        sections: row.sections.map((section) => ({
          ...section,
          items: section.items.map((item) => ({ ...item })),
        })),
      };
      mutator(draft);
      return draft;
    }));
    setSuccess(null);
  }

  function patchSection(index: number, mutator: (section: ChecklistSection) => void) {
    patchActive((row) => {
      const section = row.sections[index];
      if (section) mutator(section);
    });
  }

  function patchItem(sectionIndex: number, itemIndex: number, mutator: (item: ChecklistItem) => void) {
    patchSection(sectionIndex, (section) => {
      const item = section.items[itemIndex];
      if (item) mutator(item);
    });
  }

  function moveSection(index: number, direction: -1 | 1) {
    patchActive((row) => {
      const target = index + direction;
      if (index < 0 || target < 0 || index >= row.sections.length || target >= row.sections.length) return;
      const current = row.sections[index];
      const other = row.sections[target];
      if (!current || !other) return;
      row.sections[index] = other;
      row.sections[target] = current;
    });
  }

  async function save() {
    if (!active) return;
    const invalid = !active.label_de.trim() || !active.label_en.trim() || active.sections.some((section) =>
      !section.title_de.trim() || !section.title_en.trim() || section.items.some((item) => !item.de.trim() || !item.en.trim()));
    if (invalid) {
      setError(de ? 'Bitte alle deutschen und englischen Bezeichnungen ausfüllen.' : 'Please complete all German and English labels.');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    const { error: e } = await supabase.from('frankiflow_checklists').update({
      label_de: active.label_de.trim(),
      label_en: active.label_en.trim(),
      sections: active.sections,
      updated_at: new Date().toISOString(),
    }).eq('service_key', active.service_key);
    setSaving(false);
    if (e) setError(e.message);
    else setSuccess(de ? 'Checkliste gespeichert. Die Website nutzt jetzt diese Version.' : 'Checklist saved. The website now uses this version.');
  }

  function removeSection(index: number) {
    const section = active?.sections[index];
    const sectionName = section ? (de ? section.title_de : section.title_en) : '';
    Alert.alert(de ? 'Bereich löschen?' : 'Delete section?', sectionName, [
      { text: de ? 'Abbrechen' : 'Cancel', style: 'cancel' },
      { text: de ? 'Löschen' : 'Delete', style: 'destructive', onPress: () => patchActive((row) => { row.sections.splice(index, 1); }) },
    ]);
  }

  if (loading) return <LoadingBlock label={de ? 'Checklisten werden geladen…' : 'Loading checklists…'} />;

  return <View>
    <ErrorBanner message={error} />
    {success ? <View style={styles.success}><Text style={styles.successText}>{success}</Text></View> : null}
    <Card>
      <Text style={styles.title}>{de ? 'Leistungschecklisten' : 'Service checklists'}</Text>
      <Text style={styles.intro}>{de ? 'Diese Inhalte erscheinen im Preisrechner und können dem Angebot als PDF beigefügt werden. Deutsch und Englisch werden gemeinsam gepflegt.' : 'These items appear in the price calculator and can be attached to the quotation PDF. German and English are maintained together.'}</Text>
      <Segments value={activeKey} onChange={setActiveKey} items={rows.map((row) => ({ key: row.service_key, label: de ? row.label_de : row.label_en }))} />
    </Card>

    {active ? <>
      <Card>
        <Text style={styles.sectionLabel}>{de ? 'Servicebezeichnung' : 'Service label'}</Text>
        <FormField label="Deutsch" value={active.label_de} onChangeText={(v) => patchActive((row) => { row.label_de = v; })} />
        <FormField label="English" value={active.label_en} onChangeText={(v) => patchActive((row) => { row.label_en = v; })} />
      </Card>

      {active.sections.map((section, sectionIndex) => <Card key={`${active.service_key}-${sectionIndex}`}>
        <View style={styles.sectionTop}>
          <Text style={styles.sectionTitle}>{de ? `Bereich ${sectionIndex + 1}` : `Section ${sectionIndex + 1}`}</Text>
          <View style={styles.inlineButtons}>
            <Pressable disabled={sectionIndex === 0} onPress={() => moveSection(sectionIndex, -1)} style={[styles.iconButton, sectionIndex === 0 && styles.disabled]}><Text style={styles.iconText}>↑</Text></Pressable>
            <Pressable disabled={sectionIndex === active.sections.length - 1} onPress={() => moveSection(sectionIndex, 1)} style={[styles.iconButton, sectionIndex === active.sections.length - 1 && styles.disabled]}><Text style={styles.iconText}>↓</Text></Pressable>
            <Pressable onPress={() => removeSection(sectionIndex)} style={[styles.iconButton, styles.dangerButton]}><Text style={styles.dangerText}>×</Text></Pressable>
          </View>
        </View>
        <FormField label="Titel DE" value={section.title_de} onChangeText={(v) => patchSection(sectionIndex, (s) => { s.title_de = v; })} />
        <FormField label="Title EN" value={section.title_en} onChangeText={(v) => patchSection(sectionIndex, (s) => { s.title_en = v; })} />
        <ToggleRow label={de ? 'Nur nach ausdrücklicher Vereinbarung / optional' : 'Only when specifically agreed / optional'} value={section.optional} onValueChange={(v) => patchSection(sectionIndex, (s) => { s.optional = v; })} />

        <Text style={styles.tasksTitle}>{de ? 'Aufgaben' : 'Tasks'}</Text>
        {section.items.map((item, itemIndex) => <View key={itemIndex} style={styles.taskBox}>
          <FormField label={`DE · ${itemIndex + 1}`} value={item.de} onChangeText={(v) => patchItem(sectionIndex, itemIndex, (i) => { i.de = v; })} />
          <FormField label={`EN · ${itemIndex + 1}`} value={item.en} onChangeText={(v) => patchItem(sectionIndex, itemIndex, (i) => { i.en = v; })} />
          <Button compact variant="ghost" title={de ? 'Aufgabe entfernen' : 'Remove task'} onPress={() => patchSection(sectionIndex, (s) => { s.items.splice(itemIndex, 1); })} />
        </View>)}
        <Button compact variant="secondary" title={de ? '+ Aufgabe hinzufügen' : '+ Add task'} onPress={() => patchSection(sectionIndex, (s) => { s.items.push({ de: '', en: '' }); })} />
      </Card>)}

      <Button variant="secondary" title={de ? '+ Bereich hinzufügen' : '+ Add section'} onPress={() => patchActive((row) => { row.sections.push({ title_de: 'Neuer Bereich', title_en: 'New section', optional: false, items: [{ de: 'Neue Aufgabe', en: 'New task' }] }); })} />
      <View style={{ height: spacing.sm }} />
      <Button title={de ? 'Checkliste speichern' : 'Save checklist'} onPress={save} loading={saving} />
    </> : null}
  </View>;
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
  intro: { color: colors.muted, fontSize: 12.5, lineHeight: 18, marginTop: 6, marginBottom: 12 },
  sectionLabel: { color: colors.text, fontSize: 15, fontWeight: '900', marginBottom: 12 },
  sectionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  inlineButtons: { flexDirection: 'row', gap: 7 },
  iconButton: { width: 34, height: 34, borderRadius: 11, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  iconText: { color: colors.text, fontWeight: '900', fontSize: 16 },
  dangerButton: { backgroundColor: colors.dangerSoft },
  dangerText: { color: colors.danger, fontWeight: '900', fontSize: 20 },
  disabled: { opacity: 0.35 },
  tasksTitle: { color: colors.text, fontSize: 14, fontWeight: '900', marginTop: 12, marginBottom: 8 },
  taskBox: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 12, marginTop: 8, marginBottom: 10 },
  success: { backgroundColor: '#E9F8F2', borderRadius: radius.md, padding: 12, marginBottom: spacing.md },
  successText: { color: colors.success, fontSize: 12.5, fontWeight: '800' },
});
