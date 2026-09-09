import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Segments } from '../components/ui';
import { useLanguage } from '../context/LanguageContext';
import { colors, spacing } from '../theme';
import { QuotesView } from './flow/QuotesView';
import { JobsView } from './flow/JobsView';
import { PeopleView } from './flow/PeopleView';
import { BusinessView } from './flow/BusinessView';
import { WebsiteView } from './flow/WebsiteView';

type Tab = 'quotes' | 'jobs' | 'people' | 'business' | 'website';

export function FrankiFlowScreen() {
  const { language } = useLanguage();
  const [tab, setTab] = useState<Tab>('quotes');

  const items = [
    { key: 'quotes', label: language === 'de' ? 'Anfragen' : 'Quotes' },
    { key: 'jobs', label: language === 'de' ? 'Aufträge' : 'Jobs' },
    { key: 'people', label: language === 'de' ? 'Kunden & Team' : 'Clients & Team' },
    { key: 'business', label: language === 'de' ? 'Zahlungen & Preise' : 'Payments & Pricing' },
    { key: 'website', label: language === 'de' ? 'Webseite' : 'Website' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>FRANKIFLOW</Text>
      <Text style={styles.title}>{language === 'de' ? 'Reinigungsverwaltung' : 'Cleaning management'}</Text>
      <Text style={styles.subtitle}>{language === 'de' ? 'Anfragen, Kunden, Mitarbeiter, Aufträge und Website.' : 'Quotes, clients, employees, jobs and website.'}</Text>
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
  content: { padding: spacing.lg, paddingBottom: 110 },
  eyebrow: { color: colors.primary, fontWeight: '900', fontSize: 11, letterSpacing: 1.25 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.8, marginTop: 5 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4, marginBottom: 20 },
  body: { minHeight: 500 },
});
