import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { APP_NAME } from '../brand';
import { BrandLogo } from '../components/BrandLogo';
import { Button, ErrorBanner, FormField } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { colors, radius, spacing } from '../theme';

export function LoginScreen() {
  const { signIn } = useAuth();
  const { language, setLanguage } = useLanguage();
  const de = language === 'de';
  const [email, setEmail] = useState('info@frankiflow.de');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!email.trim() || !password) {
      setError(de ? 'Bitte E-Mail und Passwort eingeben.' : 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);
    if (result.error) setError(result.error);
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.languageRow}>
          {(['de', 'en'] as const).map((value) => (
            <Pressable key={value} onPress={() => setLanguage(value)} style={[styles.languageButton, language === value && styles.languageActive]}>
              <Text style={[styles.languageText, language === value && styles.languageTextActive]}>{value.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.brandBlock}>
          <BrandLogo kind="frankiflow" />
          <View style={styles.adminPill}><Text style={styles.adminPillText}>{APP_NAME}</Text></View>
          <Text style={styles.tagline}>{de ? 'Ein Admin-Bereich für FrankiFlow & FrankiHolz.' : 'One admin workspace for FrankiFlow & FrankiHolz.'}</Text>
        </View>

        <View style={styles.panel}>
          <View style={styles.panelTop}>
            <View>
              <Text style={styles.kicker}>{de ? 'SICHERER ZUGANG' : 'SECURE ACCESS'}</Text>
              <Text style={styles.title}>{de ? 'Willkommen zurück' : 'Welcome back'}</Text>
            </View>
            <View style={styles.secureDot} />
          </View>
          <Text style={styles.subtitle}>{de ? 'Melde dich mit deinem bestehenden Administrator-Konto an.' : 'Sign in with your existing administrator account.'}</Text>
          <ErrorBanner message={error} />
          <FormField
            label={de ? 'E-Mail' : 'Email'}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            returnKeyType="next"
          />
          <View>
            <FormField
              label={de ? 'Passwort' : 'Password'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="current-password"
              returnKeyType="done"
              onSubmitEditing={submit}
            />
            <Pressable style={styles.showButton} onPress={() => setShowPassword((v) => !v)}>
              <Text style={styles.showText}>{showPassword ? (de ? 'Ausblenden' : 'Hide') : (de ? 'Anzeigen' : 'Show')}</Text>
            </Pressable>
          </View>
          <Button title={de ? 'Anmelden' : 'Sign in'} onPress={submit} loading={loading} />
          <View style={styles.securityRow}>
            <View style={styles.securityIcon}><Text style={styles.securityIconText}>✓</Text></View>
            <Text style={styles.securityText}>{de ? 'Geschützt durch Supabase Auth und Row-Level Security.' : 'Protected by Supabase Auth and row-level security.'}</Text>
          </View>
        </View>

        <Text style={styles.footer}>{de ? 'Mehr als Reinigung · Direkter Überblick über dein Geschäft' : 'More than cleaning · Direct visibility into your business'}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg, paddingTop: 42, paddingBottom: 34 },
  languageRow: { position: 'absolute', top: Platform.OS === 'ios' ? 18 : 12, right: spacing.lg, flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.pill, padding: 3, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  languageButton: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill },
  languageActive: { backgroundColor: colors.primary },
  languageText: { color: colors.muted, fontWeight: '900', fontSize: 10 },
  languageTextActive: { color: colors.white },
  brandBlock: { alignItems: 'center', marginBottom: 24 },
  adminPill: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 13, paddingVertical: 7, marginTop: 2 },
  adminPillText: { color: colors.primary, fontWeight: '900', fontSize: 11.5, letterSpacing: 0.2 },
  tagline: { color: colors.muted, textAlign: 'center', maxWidth: 310, marginTop: 10, fontSize: 12.5, lineHeight: 18, fontWeight: '600' },
  panel: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, shadowColor: colors.primaryDark, shadowOpacity: 0.1, shadowRadius: 26, shadowOffset: { width: 0, height: 13 }, elevation: 6 },
  panelTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { color: colors.accentDark, fontSize: 9.5, fontWeight: '900', letterSpacing: 1.4 },
  title: { fontSize: 26, fontWeight: '900', color: colors.text, letterSpacing: -0.8, marginTop: 4 },
  secureDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success, shadowColor: colors.success, shadowOpacity: 0.45, shadowRadius: 8 },
  subtitle: { color: colors.muted, lineHeight: 19, marginTop: 7, marginBottom: 22, fontSize: 12.5 },
  showButton: { position: 'absolute', right: 12, top: 37, paddingHorizontal: 8, paddingVertical: 8 },
  showText: { color: colors.accentDark, fontWeight: '900', fontSize: 11 },
  securityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 16 },
  securityIcon: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center' },
  securityIconText: { color: colors.success, fontSize: 10, fontWeight: '900' },
  securityText: { color: colors.muted, fontSize: 10.5, fontWeight: '650' },
  footer: { color: colors.muted, textAlign: 'center', fontSize: 10.5, marginTop: 20, lineHeight: 16 },
});
