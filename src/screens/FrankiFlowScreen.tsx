import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BrandLogo } from '../components/BrandLogo';
import { Segments } from '../components/ui';
import { useLanguage } from '../context/LanguageContext';
import { colors, radius, spacing } from '../theme';
import { QuotesView } from './flow/QuotesView';
import { JobsView } from './flow/JobsView';
import { PeopleView } from './flow/PeopleView';
import { BusinessView } from './flow/BusinessView';
import { WebsiteView } from './flow/WebsiteView';

type Tab = 'quotes' | 'jobs' | 'people' | 'business' | 'website';

export function FrankiFlowScreen() {
  const { language } = useLanguage();
  const de = language === 'de';
  const [tab, setTab] = useState<Tab>('quotes');

  const items = [
    { key: 'quotes', label: de ? 'Anfragen' : 'Quotes' },
    { key: 'jobs', label: de ? 'Aufträge' : 'Jobs' },
    { key: 'people', label: de ? 'Kunden & Team' : 'Clients & Team' },
    { key: 'business', label: de ? 'Zahlungen & Preise' : 'Payments & Pricing' },
    { key: 'website', label: de ? 'Webseite' : 'Website' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <View style={styles.glow} />
        <BrandLogo kind="frankiflow" compact />
        <View style={styles.live}><View style={styles.liveDot} /><Text style={styles.liveText}>OPERATIONS</Text></View>
        <Text style={styles.title}>{de ? 'Reinigungsverwaltung' : 'Cleaning management'}</Text>
        <Text style={styles.subtitle}>{de ? 'Anfragen, Kunden, Team, Aufträge, Zahlungen und Website an einem Ort.' : 'Quotes, clients, team, jobs, payments and website in one place.'}</Text>
      </View>
      <Segments value={tab} onChange={(v) => setTab(v as Tab)} items={items} />
      <View style={styles.body}>
        {tab === 'quotes' ? <QuotesView /> : null}
        {tab === 'jobs' ? <JobsView /> : null}
        {tab === 'people' ? <PeopleView /> : null}
        {tab === 'business' ? <BusinessView /> : null}
        {tab === 'website' ? <WebsiteView /> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingTop: 14, paddingBottom: 112 },
  hero: { backgroundColor: colors.primary, borderRadius: radius.xl, padding: 19, marginBottom: 17, overflow: 'hidden', shadowColor: colors.primaryDark, shadowOpacity: 0.16, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 6 },
  glow: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(34,169,181,0.24)', right: -45, bottom: -62 },
  live: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 9, paddingVertical: 5, marginTop: 10 },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#5DE1C1' },
  liveText: { color: colors.white, fontSize: 8.5, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: colors.white, fontSize: 26, fontWeight: '900', letterSpacing: -0.8, marginTop: 12 },
  subtitle: { color: '#D4E2E8', fontSize: 12.5, lineHeight: 18, marginTop: 5, maxWidth: 330 },
  body: { minHeight: 500 },
});
