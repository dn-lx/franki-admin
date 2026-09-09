import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  const { access, user } = useAuth();
  const { language } = useLanguage();
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

  const firstName = useMemo(() => user?.email?.split('@')[0] ?? 'Admin', [user?.email]);
  if (loading) return <LoadingBlock label={language === 'de' ? 'Dashboard wird geladen …' : 'Loading dashboard …'} />;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />}
    >
      <Text style={styles.eyebrow}>{language === 'de' ? 'FRANKI ADMIN' : 'FRANKI ADMIN'}</Text>
      <Text style={styles.title}>{language === 'de' ? `Hallo, ${firstName}` : `Hello, ${firstName}`}</Text>
      <Text style={styles.subtitle}>{language === 'de' ? 'Dein Geschäft auf einen Blick.' : 'Your businesses at a glance.'}</Text>
      <ErrorBanner message={error} />

      {access.frankiflow ? (
        <>
          <SectionHeader title="FrankiFlow" subtitle={language === 'de' ? 'Reinigung & Objektbetreuung' : 'Cleaning & property services'} right={<Badge text="LIVE" tone="success" />} />
          <StatGrid>
            <MetricCard label={language === 'de' ? 'Neue Anfragen' : 'New quotes'} value={metrics.newQuotes} />
            <MetricCard label={language === 'de' ? 'Offene Aufträge' : 'Open jobs'} value={metrics.openJobs} />
            <MetricCard label={language === 'de' ? 'Bezahlt · 30 Tage' : 'Paid · 30 days'} value={euro(metrics.flowPaid30)} />
            <MetricCard label={language === 'de' ? 'Adminrolle' : 'Admin role'} value={(access.frankiflowRole ?? 'admin').toUpperCase()} accent="neutral" />
          </StatGrid>
          <Pressable onPress={() => onOpen('flow')} style={styles.moduleButton}>
            <Text style={styles.moduleButtonText}>{language === 'de' ? 'FrankiFlow öffnen' : 'Open FrankiFlow'}</Text><Text style={styles.arrow}>›</Text>
          </Pressable>
          <Text style={styles.listTitle}>{language === 'de' ? 'Neueste Anfragen' : 'Latest quotes'}</Text>
          {quotes.length ? quotes.map((q) => (
            <Card key={q.id} style={styles.compactCard}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}><Text style={styles.itemTitle}>{q.customer_name}</Text><Text style={styles.itemSub}>{titleCase(q.service_key)} · {shortDate(q.created_at)}</Text></View>
                <Badge text={titleCase(q.status)} tone={q.status === 'new' ? 'warning' : q.status === 'accepted' ? 'success' : 'neutral'} />
              </View>
            </Card>
          )) : <Text style={styles.none}>—</Text>}
        </>
      ) : null}

      {access.frankiholz ? (
        <View style={{ marginTop: 14 }}>
          <SectionHeader title="FrankiHolz" subtitle={language === 'de' ? 'Unterkunft & Buchungen' : 'Accommodation & bookings'} right={<Badge text="LIVE" tone="holz" />} />
          <StatGrid>
            <MetricCard label={language === 'de' ? 'Offene Anfragen' : 'Pending bookings'} value={metrics.pendingBookings} accent="holz" />
            <MetricCard label={language === 'de' ? 'Anreisen · 30 Tage' : 'Arrivals · 30 days'} value={metrics.upcomingBookings} accent="holz" />
            <MetricCard label={language === 'de' ? 'Bezahlt · 30 Tage' : 'Paid · 30 days'} value={euro(metrics.holzPaid30)} accent="holz" />
            <MetricCard label={language === 'de' ? 'Synchronisation' : 'Calendar sync'} value="iCal" accent="neutral" />
          </StatGrid>
          <Pressable onPress={() => onOpen('holz')} style={[styles.moduleButton, { backgroundColor: colors.holz }]}>
            <Text style={styles.moduleButtonText}>{language === 'de' ? 'FrankiHolz öffnen' : 'Open FrankiHolz'}</Text><Text style={styles.arrow}>›</Text>
          </Pressable>
          <Text style={styles.listTitle}>{language === 'de' ? 'Neueste Buchungen' : 'Latest bookings'}</Text>
          {bookings.length ? bookings.map((b) => (
            <Card key={b.id} style={styles.compactCard}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}><Text style={styles.itemTitle}>{b.guest_name}</Text><Text style={styles.itemSub}>{b.frankiholz_rooms?.name ?? 'Room'} · {b.check_in} → {b.check_out}</Text></View>
                <View style={{ alignItems: 'flex-end', gap: 5 }}><Badge text={titleCase(b.status)} tone={b.status === 'confirmed' ? 'success' : b.status === 'pending' ? 'warning' : 'neutral'} /><Text style={styles.price}>{euro(b.total_price)}</Text></View>
              </View>
            </Card>
          )) : <Text style={styles.none}>—</Text>}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 110 },
  eyebrow: { color: colors.primary, fontWeight: '900', fontSize: 11, letterSpacing: 1.3 },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', letterSpacing: -0.9, marginTop: 5 },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 4, marginBottom: 28 },
  moduleButton: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 17, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  moduleButtonText: { color: colors.white, fontWeight: '900', fontSize: 14 },
  arrow: { color: colors.white, fontSize: 26, lineHeight: 20 },
  listTitle: { color: colors.text, fontWeight: '900', fontSize: 15, marginBottom: 10 },
  compactCard: { paddingVertical: 13, marginBottom: 9 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  itemTitle: { color: colors.text, fontWeight: '800', fontSize: 14 },
  itemSub: { color: colors.muted, fontSize: 11, marginTop: 3 },
  price: { color: colors.text, fontWeight: '800', fontSize: 12 },
  none: { color: colors.muted, marginBottom: 20 },
});
