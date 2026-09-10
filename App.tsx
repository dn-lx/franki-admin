import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { APP_NAME } from './src/brand';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LanguageProvider, useLanguage } from './src/context/LanguageContext';
import { FrankiFlowScreen } from './src/screens/FrankiFlowScreen';
import { FrankiHolzScreen } from './src/screens/FrankiHolzScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { colors, radius } from './src/theme';

type Tab = 'home' | 'flow' | 'holz' | 'settings';

function Shell() {
  const { loading, session, access } = useAuth();
  const { language } = useLanguage();
  const [tab, setTab] = useState<Tab>('home');
  const de = language === 'de';

  const items = useMemo(() => [
    { key: 'home' as Tab, label: de ? 'Übersicht' : 'Overview', icon: '⌂', show: true, tone: colors.accent },
    { key: 'flow' as Tab, label: 'FrankiFlow', icon: 'F', show: access.frankiflow, tone: colors.accent },
    { key: 'holz' as Tab, label: 'FrankiHolz', icon: 'H', show: access.frankiholz, tone: colors.holz },
    { key: 'settings' as Tab, label: de ? 'Einstellungen' : 'Settings', icon: '⚙', show: true, tone: colors.accent },
  ].filter((x) => x.show), [access.frankiflow, access.frankiholz, de]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <View style={styles.loadingMark}><Text style={styles.loadingMarkText}>FF</Text></View>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.loadingText}>{APP_NAME}</Text>
        <Text style={styles.loadingSub}>FrankiFlow · FrankiHolz</Text>
      </View>
    );
  }

  if (!session) return <LoginScreen />;

  const safeTab = (tab === 'flow' && !access.frankiflow) || (tab === 'holz' && !access.frankiholz) ? 'home' : tab;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.screen}>
        {safeTab === 'home' ? <HomeScreen onOpen={(x) => setTab(x)} /> : null}
        {safeTab === 'flow' ? <FrankiFlowScreen /> : null}
        {safeTab === 'holz' ? <FrankiHolzScreen /> : null}
        {safeTab === 'settings' ? <SettingsScreen /> : null}
      </View>

      <View style={styles.navShadow}>
        <View style={styles.nav}>
          {items.map((item) => {
            const active = item.key === safeTab;
            return (
              <Pressable
                key={item.key}
                onPress={() => setTab(item.key)}
                style={({ pressed }) => [styles.navItem, active && styles.navItemActive, pressed && { opacity: 0.76 }]}
              >
                <View style={[styles.navIconWrap, active && { backgroundColor: item.tone }]}>
                  <Text style={[styles.navIcon, active && styles.navIconActive]}>{item.icon}</Text>
                </View>
                <Text numberOfLines={1} style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === 'android' ? 24 : 0 },
  screen: { flex: 1 },
  loading: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 28 },
  loadingMark: { width: 72, height: 72, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 18, shadowColor: colors.primaryDark, shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 7 },
  loadingMarkText: { color: colors.white, fontSize: 23, fontWeight: '900', letterSpacing: -1 },
  loadingText: { color: colors.text, fontWeight: '900', fontSize: 19, marginTop: 12, letterSpacing: -0.4 },
  loadingSub: { color: colors.muted, fontWeight: '700', fontSize: 12, marginTop: 4 },
  navShadow: { position: 'absolute', left: 12, right: 12, bottom: Platform.OS === 'ios' ? 19 : 11, borderRadius: radius.lg, shadowColor: colors.primaryDark, shadowOpacity: 0.22, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 11 },
  nav: { minHeight: 72, backgroundColor: colors.nav, borderRadius: radius.lg, flexDirection: 'row', alignItems: 'stretch', paddingHorizontal: 6, paddingVertical: 6, overflow: 'hidden' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 18, paddingHorizontal: 3, paddingVertical: 5 },
  navItemActive: { backgroundColor: 'rgba(255,255,255,0.08)' },
  navIconWrap: { width: 31, height: 31, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  navIcon: { color: '#AFC2CC', fontSize: 14, fontWeight: '900' },
  navIconActive: { color: colors.white },
  navLabel: { color: '#AFC2CC', fontSize: 8.5, fontWeight: '800' },
  navLabelActive: { color: colors.white },
});
