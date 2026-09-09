import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Button, ErrorBanner, FormField } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing } from '../theme';

export function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('info@frankiflow.de');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
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
      <View style={styles.brandBlock}>
        <View style={styles.mark}><Text style={styles.markText}>F</Text></View>
        <Text style={styles.brand}>Franki Admin</Text>
        <Text style={styles.tagline}>FrankiFlow · FrankiHolz</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.title}>Admin login</Text>
        <Text style={styles.subtitle}>Use your existing Supabase administrator account.</Text>
        <ErrorBanner message={error} />
        <FormField
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          returnKeyType="next"
        />
        <View>
          <FormField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="current-password"
            returnKeyType="done"
            onSubmitEditing={submit}
          />
          <Pressable style={styles.showButton} onPress={() => setShowPassword((v) => !v)}>
            <Text style={styles.showText}>{showPassword ? 'Hide' : 'Show'}</Text>
          </Pressable>
        </View>
        <Button title="Sign in" onPress={submit} loading={loading} />
        <Text style={styles.securityText}>Protected by Supabase Auth and row-level security. No Stripe secret keys or service-role keys are stored in this app.</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.bg },
  brandBlock: { alignItems: 'center', marginBottom: 28 },
  mark: { width: 64, height: 64, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  markText: { color: colors.white, fontWeight: '900', fontSize: 34 },
  brand: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.7 },
  tagline: { color: colors.muted, marginTop: 4, fontSize: 13, fontWeight: '600' },
  panel: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  title: { fontSize: 24, fontWeight: '900', color: colors.text, letterSpacing: -0.6 },
  subtitle: { color: colors.muted, lineHeight: 19, marginTop: 5, marginBottom: 20 },
  showButton: { position: 'absolute', right: 13, top: 37, padding: 7 },
  showText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  securityText: { marginTop: 15, color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: 'center' },
});
