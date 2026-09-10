import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Badge, Button, Card, EmptyState, ErrorBanner, FormField, KeyValue, LoadingBlock, ModalSheet, SectionHeader } from '../../components/ui';
import { useLanguage } from '../../context/LanguageContext';
import { euro, shortDate, shortDateTime } from '../../lib/format';
import { supabase } from '../../lib/supabase';
import { colors, spacing } from '../../theme';
import type { HolzBooking, HolzRoom } from '../../types';

type Filter = 'all' | 'pending' | 'confirmed' | 'paid' | 'cancelled';

function tone(status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'holz' {
  if (status === 'paid' || status === 'confirmed') return 'success';
  if (status === 'pending' || status === 'awaiting_payment') return 'warning';
  if (status === 'cancelled' || status === 'failed' || status === 'expired') return 'danger';
  return 'neutral';
}

export function BookingsView() {
  const { language } = useLanguage();
  const de = language === 'de';
  const [bookings, setBookings] = useState<HolzBooking[]>([]);
  const [rooms, setRooms] = useState<HolzRoom[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<HolzBooking | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [roomId, setRoomId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [country, setCountry] = useState('');
  const [guests, setGuests] = useState('1');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    setError(null);
    const [b, r] = await Promise.all([
      supabase.from('frankiholz_bookings').select('*, frankiholz_rooms(name)').order('created_at', { ascending: false }),
      supabase.from('frankiholz_rooms').select('*').order('sort_order'),
    ]);
    if (b.error) setError(b.error.message);
    else setBookings((b.data ?? []) as HolzBooking[]);
    if (!r.error) {
      const data = (r.data ?? []) as HolzRoom[];
      setRooms(data);
      if (!roomId && data[0]) setRoomId(data[0].id);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    const ch = supabase.channel('mobile-holz-bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'frankiholz_bookings' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const shown = useMemo(() => bookings.filter((b) => {
    if (filter === 'all') return true;
    if (filter === 'paid') return b.payment_status === 'paid';
    return b.status === filter;
  }), [bookings, filter]);

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: de ? 'Alle' : 'All' },
    { key: 'pending', label: de ? 'Offen' : 'Pending' },
    { key: 'confirmed', label: de ? 'Bestätigt' : 'Confirmed' },
    { key: 'paid', label: de ? 'Bezahlt' : 'Paid' },
    { key: 'cancelled', label: de ? 'Storniert' : 'Cancelled' },
  ];

  async function approvePayment(booking: HolzBooking) {
    setBusy(true); setError(null);
    const { data, error: fnError } = await supabase.functions.invoke('frankiholz-create-payment', { body: { booking_id: booking.id } });
    setBusy(false);
    if (fnError || data?.error) return setError(data?.error ?? fnError?.message ?? 'Payment creation failed');
    await load();
    setSelected((prev) => prev ? { ...prev, status: 'confirmed', payment_status: 'awaiting_payment', stripe_checkout_url: data?.checkout_url ?? prev.stripe_checkout_url, payment_due_at: data?.payment_due_at ?? prev.payment_due_at } : prev);
    if (data?.checkout_url) {
      Alert.alert(de ? 'Zahlungslink erstellt' : 'Payment link created', de ? 'Der Link kann jetzt an den Gast gesendet werden.' : 'The link can now be sent to the guest.', [
        { text: de ? 'Schließen' : 'Close' },
        { text: de ? 'Teilen' : 'Share', onPress: () => Share.share({ message: data.checkout_url }) },
      ]);
    }
  }

  async function cancelBooking(booking: HolzBooking) {
    Alert.alert(de ? 'Buchung stornieren?' : 'Cancel booking?', booking.reference, [
      { text: de ? 'Zurück' : 'Back', style: 'cancel' },
      { text: de ? 'Stornieren' : 'Cancel booking', style: 'destructive', onPress: async () => {
        setBusy(true); setError(null);
        const { data, error: fnError } = await supabase.functions.invoke('frankiholz-cancel-payment', { body: { booking_id: booking.id } });
        setBusy(false);
        if (fnError || data?.error) return setError(data?.error ?? fnError?.message ?? 'Cancellation failed');
        setSelected(null); await load();
      } },
    ]);
  }

  async function createBooking() {
    if (!roomId || !guestName.trim() || !guestEmail.trim() || !checkIn || !checkOut) {
      return setError(de ? 'Zimmer, Name, E-Mail, Check-in und Check-out sind erforderlich.' : 'Room, name, email, check-in and check-out are required.');
    }
    setBusy(true); setError(null);
    const { data, error: rpcError } = await supabase.rpc('frankiholz_create_booking', {
      p_room_id: roomId,
      p_check_in: checkIn,
      p_check_out: checkOut,
      p_guest_name: guestName.trim(),
      p_guest_email: guestEmail.trim(),
      p_guest_phone: guestPhone.trim() || undefined,
      p_guest_country: country.trim() || undefined,
      p_guests: Math.max(1, Number(guests) || 1),
      p_message: message.trim() || undefined,
    });
    setBusy(false);
    if (rpcError) return setError(rpcError.message);
    const result = Array.isArray(data) ? data[0] : data;
    Alert.alert(de ? 'Buchungsanfrage erstellt' : 'Booking request created', result?.reference ? `${de ? 'Referenz' : 'Reference'}: ${result.reference}\n${euro(Number(result.total_price ?? 0))}` : 'OK');
    setCreateOpen(false); setGuestName(''); setGuestEmail(''); setGuestPhone(''); setCountry(''); setGuests('1'); setCheckIn(''); setCheckOut(''); setMessage('');
    await load();
  }

  if (loading) return <LoadingBlock label={de ? 'Buchungen werden geladen…' : 'Loading bookings…'} />;

  return <>
    <SectionHeader
      title={de ? 'Buchungen' : 'Bookings'}
      subtitle={de ? 'Anfragen prüfen, Zahlungen starten und Buchungen verwalten.' : 'Review requests, start payments and manage stays.'}
      right={<Button compact variant="holz" title="+" onPress={() => setCreateOpen(true)} />}
    />
    <ErrorBanner message={error} />

    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
      {filters.map((item) => {
        const active = item.key === filter;
        return (
          <Pressable
            key={item.key}
            onPress={() => setFilter(item.key)}
            style={({ pressed }) => [styles.filterChip, active && styles.filterChipActive, pressed && styles.filterChipPressed]}
          >
            <Text numberOfLines={1} style={[styles.filterText, active && styles.filterTextActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>

    {shown.length === 0 ? <EmptyState title={de ? 'Keine Buchungen' : 'No bookings'} message={de ? 'Neue Buchungsanfragen erscheinen automatisch hier.' : 'New booking requests will appear here automatically.'} /> : shown.map((b) => (
      <Pressable key={b.id} onPress={() => { setSelected(b); setError(null); }}>
        <Card>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}><Text style={styles.title}>{b.guest_name}</Text><Text style={styles.sub}>{b.frankiholz_rooms?.name ?? 'Room'} · {b.reference}</Text></View>
            <Text style={styles.price}>{euro(Number(b.total_price))}</Text>
          </View>
          <Text style={styles.dates}>{shortDate(b.check_in)} → {shortDate(b.check_out)} · {b.guests} {de ? 'Gast/Gäste' : 'guest(s)'}</Text>
          <View style={styles.badges}><Badge text={b.status} tone={tone(b.status)} /><Badge text={b.payment_status} tone={tone(b.payment_status)} /></View>
        </Card>
      </Pressable>
    ))}

    <ModalSheet visible={!!selected} title={selected ? `${selected.guest_name} · ${selected.reference}` : ''} onClose={() => setSelected(null)}>
      {selected ? <>
        <ErrorBanner message={error} />
        <Card>
          <KeyValue label={de ? 'Zimmer' : 'Room'} value={selected.frankiholz_rooms?.name ?? '—'} />
          <KeyValue label="Check-in" value={shortDate(selected.check_in)} />
          <KeyValue label="Check-out" value={shortDate(selected.check_out)} />
          <KeyValue label={de ? 'Gäste' : 'Guests'} value={selected.guests} />
          <KeyValue label={de ? 'Gesamt' : 'Total'} value={euro(Number(selected.total_price))} />
          <KeyValue label="Status" value={<Badge text={selected.status} tone={tone(selected.status)} />} />
          <KeyValue label={de ? 'Zahlung' : 'Payment'} value={<Badge text={selected.payment_status} tone={tone(selected.payment_status)} />} />
          {selected.payment_due_at ? <KeyValue label={de ? 'Zahlbar bis' : 'Payment due'} value={shortDateTime(selected.payment_due_at)} /> : null}
        </Card>
        <Card>
          <SectionHeader title={de ? 'Gast' : 'Guest'} />
          <KeyValue label="E-Mail" value={selected.guest_email} />
          <KeyValue label={de ? 'Telefon' : 'Phone'} value={selected.guest_phone ?? '—'} />
          <KeyValue label={de ? 'Land' : 'Country'} value={selected.guest_country ?? '—'} />
          {selected.message ? <KeyValue label={de ? 'Nachricht' : 'Message'} value={selected.message} /> : null}
          <View style={styles.actions}>
            <Button compact variant="secondary" title={de ? 'E-Mail' : 'Email'} onPress={() => Linking.openURL(`mailto:${selected.guest_email}`)} />
            {selected.guest_phone ? <Button compact variant="secondary" title={de ? 'Anrufen' : 'Call'} onPress={() => Linking.openURL(`tel:${selected.guest_phone}`)} /> : null}
          </View>
        </Card>
        {selected.stripe_checkout_url ? <Button variant="holz" title={de ? 'Zahlungslink teilen' : 'Share payment link'} onPress={() => Share.share({ message: selected.stripe_checkout_url! })} /> : null}
        {selected.status === 'pending' ? <View style={{ marginTop: 10 }}><Button variant="holz" loading={busy} title={de ? 'Bestätigen + Stripe-Link erstellen' : 'Confirm + create Stripe link'} onPress={() => approvePayment(selected)} /></View> : null}
        {selected.status !== 'cancelled' && selected.payment_status !== 'paid' ? <View style={{ marginTop: 10 }}><Button variant="danger" loading={busy} title={de ? 'Buchung stornieren' : 'Cancel booking'} onPress={() => cancelBooking(selected)} /></View> : null}
        {selected.payment_status === 'paid' ? <Text style={styles.safeNote}>{de ? 'Bezahlte Buchungen werden hier nicht direkt storniert. Ein Refund-Workflow muss zuerst durchgeführt werden.' : 'Paid bookings cannot be cancelled here directly. A refund workflow must happen first.'}</Text> : null}
      </> : null}
    </ModalSheet>

    <ModalSheet visible={createOpen} title={de ? 'Neue Buchungsanfrage' : 'New booking request'} onClose={() => setCreateOpen(false)}>
      <ErrorBanner message={error} />
      <Text style={styles.label}>{de ? 'Zimmer auswählen' : 'Choose room'}</Text>
      <View style={styles.roomWrap}>{rooms.map((r) => <Pressable key={r.id} onPress={() => setRoomId(r.id)} style={[styles.roomChip, roomId === r.id && styles.roomChipActive]}><Text style={[styles.roomChipText, roomId === r.id && { color: colors.white }]}>{r.name}</Text></Pressable>)}</View>
      <FormField label={de ? 'Gastname' : 'Guest name'} value={guestName} onChangeText={setGuestName} />
      <FormField label="E-Mail" value={guestEmail} onChangeText={setGuestEmail} autoCapitalize="none" keyboardType="email-address" />
      <FormField label={de ? 'Telefon' : 'Phone'} value={guestPhone} onChangeText={setGuestPhone} keyboardType="phone-pad" />
      <FormField label={de ? 'Land' : 'Country'} value={country} onChangeText={setCountry} />
      <FormField label={de ? 'Gäste' : 'Guests'} value={guests} onChangeText={setGuests} keyboardType="number-pad" />
      <FormField label="Check-in (YYYY-MM-DD)" value={checkIn} onChangeText={setCheckIn} placeholder="2026-10-01" autoCapitalize="none" />
      <FormField label="Check-out (YYYY-MM-DD)" value={checkOut} onChangeText={setCheckOut} placeholder="2026-10-03" autoCapitalize="none" />
      <FormField label={de ? 'Nachricht / Notiz' : 'Message / note'} value={message} onChangeText={setMessage} multiline />
      <Button variant="holz" loading={busy} title={de ? 'Anfrage erstellen' : 'Create request'} onPress={createBooking} />
    </ModalSheet>
  </>;
}

const styles = StyleSheet.create({
  filterScroll: { gap: 7, paddingRight: 8, paddingBottom: 11 },
  filterChip: { height: 34, paddingHorizontal: 11, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  filterChipActive: { backgroundColor: colors.holzDark, borderColor: colors.holzDark },
  filterChipPressed: { opacity: 0.78 },
  filterText: { color: colors.text, fontSize: 10.5, lineHeight: 13, fontWeight: '900' },
  filterTextActive: { color: colors.white },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' },
  title: { color: colors.text, fontSize: 16, fontWeight: '900' }, sub: { color: colors.muted, fontSize: 12, marginTop: 3 },
  price: { color: colors.holz, fontSize: 18, fontWeight: '900' }, dates: { color: colors.text, fontSize: 13, marginTop: 12 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 }, actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  safeNote: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 12, textAlign: 'center' },
  label: { color: colors.text, fontWeight: '800', fontSize: 13, marginBottom: 8 }, roomWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
  roomChip: { borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, backgroundColor: colors.surface },
  roomChipActive: { backgroundColor: colors.holz, borderColor: colors.holz }, roomChipText: { color: colors.text, fontWeight: '800', fontSize: 12 },
});
