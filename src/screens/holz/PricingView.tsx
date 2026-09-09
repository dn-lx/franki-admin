import React, { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button, Card, ErrorBanner, FormField, LoadingBlock, SectionHeader } from '../../components/ui';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme';
import type { HolzPricing } from '../../types';

export function PricingView() {
  const { language } = useLanguage(); const de = language === 'de';
  const [value, setValue] = useState<HolzPricing | null>(null); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null);
  async function load() { const { data, error } = await supabase.from('frankiholz_pricing_settings').select('*').eq('id', 1).single(); if (error) setError(error.message); else setValue(data as HolzPricing); setLoading(false); }
  useEffect(() => { load(); }, []);
  const setNum = (key: keyof HolzPricing, raw: string) => setValue((p) => p ? { ...p, [key]: Number(raw.replace(',', '.')) || 0 } : p);
  async function save() {
    if (!value) return; setSaving(true); setError(null);
    const payload = { weekend_markup_pct: value.weekend_markup_pct, last_minute_days: value.last_minute_days, last_minute_discount_pct: value.last_minute_discount_pct, long_stay_nights_1: value.long_stay_nights_1, long_stay_discount_1_pct: value.long_stay_discount_1_pct, long_stay_nights_2: value.long_stay_nights_2, long_stay_discount_2_pct: value.long_stay_discount_2_pct, occupancy_level_1_pct: value.occupancy_level_1_pct, occupancy_markup_1_pct: value.occupancy_markup_1_pct, occupancy_level_2_pct: value.occupancy_level_2_pct, occupancy_markup_2_pct: value.occupancy_markup_2_pct, payment_hold_minutes: value.payment_hold_minutes };
    const { error } = await supabase.from('frankiholz_pricing_settings').update(payload).eq('id', 1); setSaving(false); if (error) setError(error.message); else await load();
  }
  if (loading) return <LoadingBlock />; if (!value) return <ErrorBanner message={error ?? 'Pricing unavailable'} />;
  return <>
    <SectionHeader title={de ? 'Dynamische Preise' : 'Dynamic pricing'} subtitle={de ? 'Regeln für Wochenenden, Last Minute, längere Aufenthalte und Auslastung.' : 'Rules for weekends, last minute, long stays and occupancy.'} />
    <ErrorBanner message={error} />
    <Card><Text style={styles.group}>{de ? 'Wochenende & Last Minute' : 'Weekend & last minute'}</Text>
      <FormField label={de ? 'Wochenend-Aufschlag (%)' : 'Weekend markup (%)'} keyboardType="decimal-pad" value={String(value.weekend_markup_pct)} onChangeText={(v) => setNum('weekend_markup_pct', v)} />
      <FormField label={de ? 'Last-Minute-Fenster (Tage)' : 'Last-minute window (days)'} keyboardType="number-pad" value={String(value.last_minute_days)} onChangeText={(v) => setNum('last_minute_days', v)} />
      <FormField label={de ? 'Last-Minute-Rabatt (%)' : 'Last-minute discount (%)'} keyboardType="decimal-pad" value={String(value.last_minute_discount_pct)} onChangeText={(v) => setNum('last_minute_discount_pct', v)} />
    </Card>
    <Card><Text style={styles.group}>{de ? 'Langzeit-Rabatte' : 'Long-stay discounts'}</Text>
      <FormField label={de ? 'Stufe 1 ab Nächten' : 'Level 1 from nights'} keyboardType="number-pad" value={String(value.long_stay_nights_1)} onChangeText={(v) => setNum('long_stay_nights_1', v)} />
      <FormField label={de ? 'Stufe 1 Rabatt (%)' : 'Level 1 discount (%)'} keyboardType="decimal-pad" value={String(value.long_stay_discount_1_pct)} onChangeText={(v) => setNum('long_stay_discount_1_pct', v)} />
      <FormField label={de ? 'Stufe 2 ab Nächten' : 'Level 2 from nights'} keyboardType="number-pad" value={String(value.long_stay_nights_2)} onChangeText={(v) => setNum('long_stay_nights_2', v)} />
      <FormField label={de ? 'Stufe 2 Rabatt (%)' : 'Level 2 discount (%)'} keyboardType="decimal-pad" value={String(value.long_stay_discount_2_pct)} onChangeText={(v) => setNum('long_stay_discount_2_pct', v)} />
    </Card>
    <Card><Text style={styles.group}>{de ? 'Auslastungs-Aufschläge' : 'Occupancy markups'}</Text>
      <FormField label={de ? 'Stufe 1 Auslastung (%)' : 'Level 1 occupancy (%)'} keyboardType="decimal-pad" value={String(value.occupancy_level_1_pct)} onChangeText={(v) => setNum('occupancy_level_1_pct', v)} />
      <FormField label={de ? 'Stufe 1 Aufschlag (%)' : 'Level 1 markup (%)'} keyboardType="decimal-pad" value={String(value.occupancy_markup_1_pct)} onChangeText={(v) => setNum('occupancy_markup_1_pct', v)} />
      <FormField label={de ? 'Stufe 2 Auslastung (%)' : 'Level 2 occupancy (%)'} keyboardType="decimal-pad" value={String(value.occupancy_level_2_pct)} onChangeText={(v) => setNum('occupancy_level_2_pct', v)} />
      <FormField label={de ? 'Stufe 2 Aufschlag (%)' : 'Level 2 markup (%)'} keyboardType="decimal-pad" value={String(value.occupancy_markup_2_pct)} onChangeText={(v) => setNum('occupancy_markup_2_pct', v)} />
    </Card>
    <Card><Text style={styles.group}>{de ? 'Zahlungsfenster' : 'Payment window'}</Text><FormField label={de ? 'Reservierung halten (Minuten)' : 'Hold reservation (minutes)'} keyboardType="number-pad" value={String(value.payment_hold_minutes)} onChangeText={(v) => setNum('payment_hold_minutes', v)} /></Card>
    <Button variant="holz" loading={saving} title={de ? 'Preisstrategie speichern' : 'Save pricing strategy'} onPress={save} />
  </>;
}
const styles = StyleSheet.create({ group: { color: colors.holz, fontSize: 15, fontWeight: '900', marginBottom: 14 } });
