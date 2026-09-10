import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BrandLogo } from '../components/BrandLogo';
import { Segments } from '../components/ui';
import { useLanguage } from '../context/LanguageContext';
import { colors, radius, spacing } from '../theme';
import { BookingsView } from './holz/BookingsView';
import { CalendarView } from './holz/CalendarView';
import { RoomsView } from './holz/RoomsView';
import { PricingView } from './holz/PricingView';
import { IntegrationsView } from './holz/IntegrationsView';
import { HolzWebsiteView } from './holz/WebsiteView';

type Tab = 'bookings' | 'calendar' | 'rooms' | 'pricing' | 'website' | 'sync';

export function FrankiHolzScreen() {
  const { language } = useLanguage();
  const de = language === 'de';
  const [tab, setTab] = useState<Tab>('bookings');
  const items = [
    { key: 'bookings', label: de ? 'Buchungen' : 'Bookings' },
    { key: 'calendar', label: de ? 'Kalender' : 'Calendar' },
    { key: 'rooms', label: de ? 'Zimmer' : 'Rooms' },
    { key: 'pricing', label: de ? 'Preise' : 'Pricing' },
    { key: 'website', label: de ? 'Webseite' : 'Website' },
    { key: 'sync', label: 'iCal / Airbnb' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <View style={styles.glow} />
        <BrandLogo kind="frankiholz" compact />
        <View style={styles.live}><View style={styles.liveDot} /><Text style={styles.liveText}>STAYS & BOOKINGS</Text></View>
        <Text style={styles.title}>{de ? 'Unterkunftsverwaltung' : 'Accommodation management'}</Text>
        <Text style={styles.subtitle}>{de ? 'Buchungen, Kalender, Zimmer, Preise, Website und Plattform-Synchronisierung.' : 'Bookings, calendar, rooms, pricing, website and platform sync.'}</Text>
      </View>
      <Segments accent="holz" value={tab} onChange={(v) => setTab(v as Tab)} items={items} />
      <View style={styles.body}>
        {tab === 'bookings' ? <BookingsView /> : null}
        {tab === 'calendar' ? <CalendarView /> : null}
        {tab === 'rooms' ? <RoomsView /> : null}
        {tab === 'pricing' ? <PricingView /> : null}
        {tab === 'website' ? <HolzWebsiteView /> : null}
        {tab === 'sync' ? <IntegrationsView /> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingTop: 14, paddingBottom: 112 },
  hero: { backgroundColor: colors.holzDark, borderRadius: radius.xl, padding: 19, marginBottom: 17, overflow: 'hidden', shadowColor: colors.primaryDark, shadowOpacity: 0.15, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 6 },
  glow: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(100,227,220,0.20)', right: -48, top: -58 },
  live: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.13)', paddingHorizontal: 9, paddingVertical: 5, marginTop: 10 },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#87F5E6' },
  liveText: { color: colors.white, fontSize: 8.5, fontWeight: '900', letterSpacing: 1.05 },
  title: { color: colors.white, fontSize: 26, fontWeight: '900', letterSpacing: -0.8, marginTop: 12 },
  subtitle: { color: '#D5F1F1', fontSize: 12.5, lineHeight: 18, marginTop: 5, maxWidth: 330 },
  body: { minHeight: 500 },
});
