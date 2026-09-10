import React, { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { APP_NAME, APP_VERSION } from '../brand';
import { BrandLogo } from '../components/BrandLogo';
import { Badge, Button, Card, ErrorBanner, KeyValue, SectionHeader, Segments } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { projectUrl } from '../lib/supabase';
import { colors, radius, spacing } from '../theme';

export function SettingsScreen() {
  const { user, access, signOut, refreshAccess } = useAuth();
  const { language, setLanguage } = useLanguage();
  const de = language === 'de';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setBusy(true); setError(null);
    try { await refreshAccess(); } catch (e: any) { setError(e.message ?? String(e)); } finally { setBusy(false); }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroTop}><BrandLogo kind="frankiflow" compact /><Badge text={APP_VERSION} tone="info" /></View>
        <Text style={styles.kicker}>FRANKIFLOW ADMIN APP</Text>
        <Text style={styles.title}>{de ? 'Einstellungen' : 'Settings'}</Text>
        <Text style={styles.subtitle}>{de ? 'Konto, Sprache, Zugriffsrechte, Backend und App-Informationen.' : 'Account, language, access rights, backend and app information.'}</Text>
      </View>

      <ErrorBanner message={error} />
      <SectionHeader title={de ? 'Sprache' : 'Language'} />
      <Segments value={language} onChange={(v) => setLanguage(v as 'de' | 'en')} items={[{ key: 'de', label: 'Deutsch' }, { key: 'en', label: 'English' }]} />

      <SectionHeader title={de ? 'Admin-Konto' : 'Admin account'} subtitle={de ? 'Aktive Berechtigungen für diesen Benutzer.' : 'Active permissions for this user.'} />
      <Card>
        <KeyValue label="E-Mail" value={user?.email ?? '—'} />
        <KeyValue label={de ? 'FrankiFlow Zugriff' : 'FrankiFlow access'} value={<Badge text={access.frankiflow ? (access.frankiflowRole ?? 'admin') : (de ? 'Kein Zugriff' : 'No access')} tone={access.frankiflow ? 'success' : 'neutral'} />} />
        <KeyValue label={de ? 'FrankiHolz Zugriff' : 'FrankiHolz access'} value={<Badge text={access.frankiholz ? 'admin' : (de ? 'Kein Zugriff' : 'No access')} tone={access.frankiholz ? 'holz' : 'neutral'} />} />
      </Card>
      <Button variant="secondary" loading={busy} title={de ? 'Zugriffsrechte neu prüfen' : 'Refresh permissions'} onPress={refresh} />

      <View style={styles.gap} />
      <SectionHeader title={de ? 'Backend & Sicherheit' : 'Backend & security'} />
      <Card>
        <KeyValue label="Provider" value="Supabase" />
        <KeyValue label="Project" value="FrankiFlow & FrankiHolz Backend" />
        <KeyValue label="Region" value="eu-central-1" />
        <KeyValue label="Endpoint" value={projectUrl.replace('https://', '')} mono />
        <View style={styles.securityBox}><View style={styles.securityDot} /><Text style={styles.security}>{de ? 'Die mobile App enthält nur den öffentlichen Supabase Publishable Key. Service-Role- und Stripe-Secret-Keys bleiben serverseitig.' : 'The mobile app contains only the public Supabase publishable key. Service-role and Stripe secret keys remain server-side.'}</Text></View>
      </Card>

      <SectionHeader title={de ? 'App-Information' : 'App information'} />
      <Card>
        <KeyValue label="Name" value={APP_NAME} />
        <KeyValue label="Version" value={APP_VERSION} />
        <KeyValue label="iOS" value="de.frankiflow.admin" mono />
        <KeyValue label="Android" value="de.frankiflow.admin" mono />
      </Card>

      <View style={styles.links}>
        <Button compact variant="secondary" title="frankiflow.de ↗" onPress={() => Linking.openURL('https://www.frankiflow.de')} />
        <Button compact variant="secondary" title="FrankiHolz ↗" onPress={() => Linking.openURL('https://accommodation.frankiflow.de')} />
      </View>

      <View style={styles.gapLarge} />
      <Button variant="danger" title={de ? 'Abmelden' : 'Sign out'} onPress={signOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingTop: 14, paddingBottom: 112 },
  hero: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, marginBottom: 20, shadowColor: colors.primaryDark, shadowOpacity: 0.07, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { color: colors.accentDark, fontWeight: '900', fontSize: 9, letterSpacing: 1.3, marginTop: 13 },
  title: { color: colors.text, fontSize: 27, fontWeight: '900', letterSpacing: -0.8, marginTop: 4 },
  subtitle: { color: colors.muted, fontSize: 12.5, lineHeight: 18, marginTop: 5 },
  securityBox: { backgroundColor: colors.successSoft, borderRadius: 15, padding: 12, marginTop: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  securityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success, marginTop: 5 },
  security: { color: colors.success, fontSize: 10.5, lineHeight: 16, flex: 1, fontWeight: '700' },
  links: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  gap: { height: 24 },
  gapLarge: { height: 30 },
});
