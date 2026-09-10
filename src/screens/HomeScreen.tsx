import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BrandLogo } from '../components/BrandLogo';
import { Badge, Card, ErrorBanner, LoadingBlock, MetricCard, SectionHeader, StatGrid } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { euro, shortDate, titleCase } from '../lib/format';
import { colors, radius, spacing } from '../theme';
import type { HolzBooking, QuoteRequest } from '../types';

type Props = { onOpen: (tab: 'flow' | 'holz') => void };

type Metrics = {
  newQuotes: number;
  openJobs: number;
  flowPaid30: number;
  pendingBookings: number;
  upcomingBookings: number;
  holzPaid30: number;
};

const initial: Metrics = { newQuotes: 0, openJobs: 0, flowPaid30: 0, pendingBookings: 0, upcomingBookings: 0, holzPaid30: 0 };

export function HomeScreen({ onOpen }: Props) {
  const { access } = useAuth();
  const { language } = useLanguage();
  const de = language === 'de';
  const [metrics, setMetrics] = useState(initial);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [bookings, setBookings] = useState<HolzBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const in30 = new Date(now); in30.setDate(in30.getDate() + 30);
      const since30 = new Date(now); since30.setDate(since30.getDate() - 30);
      const calls: PromiseLike<any>[] = [];

      const flowQueries = access.frankiflow ? [
        supabase.from('frankiflow_quote_requests').select('*').order('created_at', { ascending: false }).limit(4),
        supabase.from('frankiflow_quote_requests').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('frankiflow_jobs').select('id', { count: 'exact', head: true }).in('status', ['scheduled', 'in_progress']),
        supabase.from('frankiflow_payments').select('amount_cents').eq('status', 'paid').gte('paid_at', since30.toISOString()),
      ] : [];

      const holzQueries = access.frankiholz ? [
        supabase.from('frankiholz_bookings').select('*, frankiholz_rooms(name)').order('created_at', { ascending: false }).limit(4),
        supabase.from('frankiholz_bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('frankiholz_bookings').select('id', { count: 'exact', head: true }).eq('status', 'confirmed').gte('check_in', now.toISOString().slice(0, 10)).lte('check_in', in30.toISOString().slice(0, 10)),
        supabase.from('frankiholz_bookings').select('total_price').eq('payment_status', 'paid').gte('paid_at', since30.toISOString()),
      ] : [];

      calls.push(...flowQueries, ...holzQueries);
      const results = await Promise.all(calls);
      let i = 0;
      const next = { ...initial };
      if (access.frankiflow) {
        const recent = results[i++]; const countQuotes = results[i++]; const countJobs = results[i++]; const flowPaid = results[i++];
        if (recent.error) throw recent.error;
        setQuotes((recent.data ?? []) as QuoteRequest[]);
        next.newQuotes = countQuotes.count ?? 0;
        next.openJobs = countJobs.count ?? 0;
        next.flowPaid30 = (flowPaid.data ?? []).reduce((sum: number, row: any) => sum + Number(row.amount_cents || 0), 0) / 100;
      }
      if (access.frankiholz) {
        const recent = results[i++]; const pending = results[i++]; const upcoming = results[i++]; const holzPaid = results[i++];
        if (recent.error) throw recent.error;
        setBookings((recent.data ?? []) as HolzBooking[]);
        next.pendingBookings = pending.count ?? 0;
        next.upcomingBookings = upcoming.count ?? 0;
        next.holzPaid30 = (holzPaid.data ?? []).reduce((sum: number, row: any) => sum + Number(row.total_price || 0), 0);
      }
      setMetrics(next);
    } catch (e: any) {
      setError(e?.message ?? 'Could not load the dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [access.frankiflow, access.frankiholz]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const channel = supabase.channel('mobile-dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'frankiflow_quote_requests' }, () => load(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'frankiflow_jobs' }, () => load(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'frankiholz_bookings' }, () => load(true))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  if (loading) return <LoadingBlock label={de ? 'Dashboard wird geladen …' : 'Loading dashboard …'} />;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl tintColor={colors.accent} refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />}
    >
      <View style={styles.hero}>
        <View style={styles.heroGlow} />
        <View style={styles.heroTop}>
          <View style={styles.heroBadge}><View style={styles.liveDot} /><Text style={styles.heroBadgeText}>ADMIN LIVE</Text></View>
          <Text style={styles.heroMeta}>{de ? 'Heute' : 'Today'}</Text>
        </View>
        <Text style={styles.heroTitle}>Dashboard</Text>
        <Text style={styles.heroSub}>{de ? 'FrankiFlow und FrankiHolz in einem klaren Arbeitsbereich.' : 'FrankiFlow and FrankiHolz in one clear workspace.'}</Text>
        <View style={styles.heroSummary}>
          <View style={styles.heroSummaryItem}><Text style={styles.heroSummaryValue}>{metrics.newQuotes + metrics.pendingBookings}</Text><Text style={styles.heroSummaryLabel}>{de ? 'Neue Anfragen' : 'New requests'}</Text></View>
          <View style={styles.heroDivider} />
          <View style={styles.heroSummaryItem}><Text style={styles.heroSummaryValue}>{metrics.openJobs + metrics.upcomingBookings}</Text><Text style={styles.heroSummaryLabel}>{de ? 'Aktiv / bevorstehend' : 'Active / upcoming'}</Text></View>
        </View>
      </View>

      <ErrorBanner message={error} />

      <SectionHeader title={de ? 'Deine Bereiche' : 'Your workspaces'} subtitle={de ? 'Direkter Zugriff auf beide Geschäftsbereiche.' : 'Direct access to both business areas.'} />

      {access.frankiflow ? (
        <Pressable onPress={() => onOpen('flow')} style={({ pressed }) => [styles.businessCard, pressed && styles.pressed]}>
          <View style={styles.businessCardTop}>
            <BrandLogo kind="frankiflow" compact />
            <Badge text="LIVE" tone="success" />
          </View>
          <Text style={styles.businessHeadline}>{de ? 'Reinigung steuern' : 'Run cleaning operations'}</Text>
          <Text style={styles.businessDescription}>{de ? 'Anfragen, Aufträge, Team, Zahlungen und Website.' : 'Quotes, jobs, team, payments and website.'}</Text>
          <View style={styles.businessFooter}><Text style={styles.businessLink}>{de ? 'FrankiFlow öffnen' : 'Open FrankiFlow'}</Text><Text style={styles.businessArrow}>→</Text></View>
        </Pressable>
      ) : null}

      {access.frankiholz ? (
        <Pressable onPress={() => onOpen('holz')} style={({ pressed }) => [styles.businessCard, styles.holzCard, pressed && styles.pressed]}>
          <View style={styles.businessCardTop}>
            <BrandLogo kind="frankiholz" compact />
            <Badge text="LIVE" tone="holz" />
          </View>
          <Text style={styles.businessHeadline}>{de ? 'Unterkunft steuern' : 'Run accommodation'}</Text>
          <Text style={styles.businessDescription}>{de ? 'Buchungen, Kalender, Zimmer, Preise und Airbnb-Sync.' : 'Bookings, calendar, rooms, pricing and Airbnb sync.'}</Text>
          <View style={styles.businessFooter}><Text style={[styles.businessLink, { color: colors.holzDark }]}>{de ? 'FrankiHolz öffnen' : 'Open FrankiHolz'}</Text><Text style={[styles.businessArrow, { color: colors.holzDark }]}>→</Text></View>
        </Pressable>
      ) : null}

      {access.frankiflow ? (
        <>
          <SectionHeader title="FrankiFlow" subtitle={de ? 'Leistung der letzten 30 Tage' : 'Performance over the last 30 days'} />
          <StatGrid>
            <MetricCard label={de ? 'Neue Anfragen' : 'New quotes'} value={metrics.newQuotes} />
            <MetricCard label={de ? 'Offene Aufträge' : 'Open jobs'} value={metrics.openJobs} />
            <MetricCard label={de ? 'Bezahlt · 30 Tage' : 'Paid · 30 days'} value={euro(metrics.flowPaid30)} />
            <MetricCard label={de ? 'Adminrolle' : 'Admin role'} value={(access.frankiflowRole ?? 'admin').toUpperCase()} accent="neutral" />
          </StatGrid>
          <Text style={styles.listTitle}>{de ? 'Neueste Anfragen' : 'Latest quotes'}</Text>
          {quotes.length ? quotes.map((q) => (
            <Card key={q.id} style={styles.compactCard}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}><Text style={styles.itemTitle}>{q.customer_name}</Text><Text style={styles.itemSub}>{titleCase(q.service_key)} · {shortDate(q.created_at)}</Text></View>
                <Badge text={titleCase(q.status)} tone={q.status === 'new' ? 'warning' : q.status === 'won' ? 'success' : 'neutral'} />
              </View>
            </Card>
          )) : <Text style={styles.none}>—</Text>}
        </>
      ) : null}

      {access.frankiholz ? (
        <View style={styles.sectionGap}>
          <SectionHeader title="FrankiHolz" subtitle={de ? 'Buchungsleistung der letzten 30 Tage' : 'Booking performance over the last 30 days'} />
          <StatGrid>
            <MetricCard label={de ? 'Offene Anfragen' : 'Pending bookings'} value={metrics.pendingBookings} accent="holz" />
            <MetricCard label={de ? 'Anreisen · 30 Tage' : 'Arrivals · 30 days'} value={metrics.upcomingBookings} accent="holz" />
            <MetricCard label={de ? 'Bezahlt · 30 Tage' : 'Paid · 30 days'} value={euro(metrics.holzPaid30)} accent="holz" />
            <MetricCard label={de ? 'Synchronisation' : 'Calendar sync'} value="iCal" accent="neutral" />
          </StatGrid>
          <Text style={styles.listTitle}>{de ? 'Neueste Buchungen' : 'Latest bookings'}</Text>
          {bookings.length ? bookings.map((b) => (
            <Card key={b.id} style={styles.compactCard}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}><Text style={styles.itemTitle}>{b.guest_name}</Text><Text style={styles.itemSub}>{b.frankiholz_rooms?.name ?? 'Room'} · {b.check_in} → {b.check_out}</Text></View>
                <View style={styles.priceWrap}><Badge text={titleCase(b.status)} tone={b.status === 'confirmed' ? 'success' : b.status === 'pending' ? 'warning' : 'neutral'} /><Text style={styles.price}>{euro(b.total_price)}</Text></View>
              </View>
            </Card>
          )) : <Text style={styles.none}>—</Text>}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingTop: 14, paddingBottom: 112 },
  hero: { backgroundColor: colors.primary, borderRadius: radius.xl, padding: 22, marginBottom: 22, overflow: 'hidden', shadowColor: colors.primaryDark, shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 7 },
  heroGlow: { position: 'absolute', width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(34,169,181,0.22)', right: -48, top: -62 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.12)' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#5DE1C1' },
  heroBadgeText: { color: colors.white, fontWeight: '900', fontSize: 9.5, letterSpacing: 1 },
  heroMeta: { color: '#C8D9E2', fontSize: 11, fontWeight: '800' },
  heroTitle: { color: colors.white, fontSize: 31, fontWeight: '900', letterSpacing: -1 },
  heroSub: { color: '#D3E2E8', fontSize: 13, lineHeight: 19, marginTop: 7, maxWidth: 310 },
  heroSummary: { marginTop: 24, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 17, flexDirection: 'row', alignItems: 'center' },
  heroSummaryItem: { flex: 1 },
  heroSummaryValue: { color: colors.white, fontWeight: '900', fontSize: 22, letterSpacing: -0.5 },
  heroSummaryLabel: { color: '#BFD3DC', fontWeight: '700', fontSize: 10.5, marginTop: 2 },
  heroDivider: { width: StyleSheet.hairlineWidth, height: 38, backgroundColor: 'rgba(255,255,255,0.22)', marginHorizontal: 18 },
  businessCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 17, marginBottom: 12, shadowColor: colors.primaryDark, shadowOpacity: 0.07, shadowRadius: 16, shadowOffset: { width: 0, height: 7 }, elevation: 3 },
  holzCard: { borderColor: '#CBECEF', backgroundColor: '#FBFEFE' },
  pressed: { opacity: 0.83, transform: [{ scale: 0.992 }] },
  businessCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 50 },
  businessHeadline: { color: colors.text, fontSize: 18, fontWeight: '900', letterSpacing: -0.45, marginTop: 14 },
  businessDescription: { color: colors.muted, fontSize: 12.5, lineHeight: 18, marginTop: 5 },
  businessFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 17, paddingTop: 13, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  businessLink: { color: colors.primary, fontWeight: '900', fontSize: 12.5 },
  businessArrow: { color: colors.primary, fontWeight: '900', fontSize: 18 },
  listTitle: { color: colors.text, fontWeight: '900', fontSize: 14.5, marginBottom: 10 },
  compactCard: { paddingVertical: 13, marginBottom: 9, borderRadius: 18 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  itemTitle: { color: colors.text, fontWeight: '800', fontSize: 13.5 },
  itemSub: { color: colors.muted, fontSize: 10.5, marginTop: 4 },
  priceWrap: { alignItems: 'flex-end', gap: 5 },
  price: { color: colors.text, fontWeight: '900', fontSize: 11.5 },
  none: { color: colors.muted, marginBottom: 20 },
  sectionGap: { marginTop: 17 },
});
