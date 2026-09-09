import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, ErrorBanner, FormField, LoadingBlock, ModalSheet, SectionHeader, Segments } from '../../components/ui';
import { useLanguage } from '../../context/LanguageContext';
import { euro, isoDateLocal, monthLabel, monthRange, safeNumber } from '../../lib/format';
import { supabase } from '../../lib/supabase';
import { colors, radius, spacing } from '../../theme';
import type { HolzCalendarRate, HolzCalendarRow, HolzRoom } from '../../types';

type DayInfo = HolzCalendarRate & { row?: HolzCalendarRow; external?: boolean };

export function CalendarView() {
  const { language } = useLanguage(); const de = language === 'de';
  const [rooms, setRooms] = useState<HolzRoom[]>([]); const [roomId, setRoomId] = useState(''); const [month, setMonth] = useState(() => new Date());
  const [days, setDays] = useState<Record<string, DayInfo>>({}); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null); const [endDate, setEndDate] = useState(''); const [status, setStatus] = useState<'available'|'blocked'>('blocked'); const [price, setPrice] = useState(''); const [note, setNote] = useState('');

  async function loadRooms() { const { data, error } = await supabase.from('frankiholz_rooms').select('*').order('sort_order'); if (error) setError(error.message); else { const rs = (data ?? []) as HolzRoom[]; setRooms(rs); if (!roomId && rs[0]) setRoomId(rs[0].id); } }
  async function loadCalendar(activeRoom = roomId, activeMonth = month) {
    if (!activeRoom) { setLoading(false); return; } setLoading(true); setError(null);
    const { from, to } = monthRange(activeMonth);
    const [rateRes, rowRes, extRes] = await Promise.all([
      supabase.rpc('frankiholz_get_calendar_rates', { p_room_id: activeRoom, p_from: from, p_to: to }),
      supabase.from('frankiholz_calendar').select('*').eq('room_id', activeRoom).gte('date', from).lte('date', to),
      supabase.from('frankiholz_ical_blocks').select('date').eq('room_id', activeRoom).gte('date', from).lte('date', to),
    ]);
    if (rateRes.error) setError(rateRes.error.message);
    const map: Record<string, DayInfo> = {}; const rows = (rowRes.data ?? []) as HolzCalendarRow[]; const rowMap = new Map(rows.map((r) => [r.date, r])); const external = new Set((extRes.data ?? []).map((x: any) => x.date));
    ((rateRes.data ?? []) as HolzCalendarRate[]).forEach((r) => { map[r.date] = { ...r, row: rowMap.get(r.date), external: external.has(r.date) }; });
    setDays(map); setLoading(false);
  }
  useEffect(() => { loadRooms(); }, []);
  useEffect(() => { if (roomId) loadCalendar(roomId, month); }, [roomId, month]);

  const grid = useMemo(() => {
    const { first, last } = monthRange(month); const cells: (string|null)[] = []; const mondayIndex = (first.getDay() + 6) % 7; for (let i=0;i<mondayIndex;i++) cells.push(null);
    for (let d=1; d<=last.getDate(); d++) cells.push(isoDateLocal(new Date(month.getFullYear(), month.getMonth(), d))); while (cells.length % 7) cells.push(null); return cells;
  }, [month]);

  function openDay(date: string) { const info = days[date]; setSelectedDate(date); setEndDate(date); setStatus(info?.is_available ? 'available' : 'blocked'); setPrice(info?.row?.price_override != null ? String(info.row.price_override) : ''); setNote(info?.row?.note ?? ''); setError(null); }
  async function saveRange() {
    if (!selectedDate || !endDate) return; setBusy(true); setError(null); const p = safeNumber(price);
    const { error: rpcError } = await supabase.rpc('frankiholz_set_calendar_range', { p_room_id: roomId, p_start_date: selectedDate, p_end_date: endDate, p_status: status, p_price_override: p, p_note: note.trim() || undefined });
    setBusy(false); if (rpcError) return setError(rpcError.message); setSelectedDate(null); await loadCalendar();
  }
  async function clearOverride() {
    if (!selectedDate || !endDate) return; setBusy(true); const { error } = await supabase.from('frankiholz_calendar').update({ price_override: null }).eq('room_id', roomId).gte('date', selectedDate).lte('date', endDate).is('booking_id', null); setBusy(false); if (error) setError(error.message); else { setPrice(''); await loadCalendar(); }
  }
  const prev = () => setMonth((m) => new Date(m.getFullYear(), m.getMonth()-1, 1)); const next = () => setMonth((m) => new Date(m.getFullYear(), m.getMonth()+1, 1));
  const selectedInfo = selectedDate ? days[selectedDate] : null;

  return <>
    <SectionHeader title={de ? 'Kalender & Verfügbarkeit' : 'Calendar & availability'} subtitle={de ? 'Preise, Sperren, Buchungen und externe Kalender in einer Ansicht.' : 'Rates, blocks, bookings and external calendars in one view.'} />
    <ErrorBanner message={error} />
    <Segments accent="holz" value={roomId} onChange={setRoomId} items={rooms.map((r) => ({ key: r.id, label: r.name }))} />
    <Card>
      <View style={styles.monthNav}><Button compact variant="secondary" title="‹" onPress={prev} /><Text style={styles.month}>{monthLabel(month, language)}</Text><Button compact variant="secondary" title="›" onPress={next} /></View>
      {loading ? <LoadingBlock /> : <>
        <View style={styles.week}>{(de ? ['Mo','Di','Mi','Do','Fr','Sa','So'] : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']).map((x) => <Text key={x} style={styles.weekText}>{x}</Text>)}</View>
        <View style={styles.grid}>{grid.map((date, idx) => {
          if (!date) return <View key={`e${idx}`} style={styles.cell} />; const info = days[date]; const num = Number(date.slice(-2)); const booked = info?.availability_status === 'booked' || !!info?.row?.booking_id; const blocked = info && !info.is_available; const external = info?.external;
          return <Pressable key={date} onPress={() => openDay(date)} style={[styles.cell, booked && styles.booked, blocked && !booked && styles.blocked, external && styles.external]}>
            <Text style={[styles.dayNum, (booked || blocked || external) && { color: colors.white }]}>{num}</Text>
            {info ? <Text numberOfLines={1} style={[styles.rate, (booked || blocked || external) && { color: colors.white }]}>{Math.round(info.nightly_price)}€</Text> : null}
            {booked ? <Text style={styles.marker}>●</Text> : external ? <Text style={styles.marker}>↔</Text> : blocked ? <Text style={styles.marker}>×</Text> : null}
          </Pressable>;
        })}</View>
        <View style={styles.legend}><Text style={styles.legendText}>● {de ? 'Buchung' : 'Booking'}</Text><Text style={styles.legendText}>× {de ? 'Gesperrt' : 'Blocked'}</Text><Text style={styles.legendText}>↔ iCal/Airbnb</Text></View>
      </>}
    </Card>

    <ModalSheet visible={!!selectedDate} title={selectedDate ?? ''} onClose={() => setSelectedDate(null)}>
      <ErrorBanner message={error} />
      {selectedInfo ? <Card><Text style={styles.current}>{de ? 'Aktuell' : 'Current'}: {selectedInfo.availability_status} · {euro(selectedInfo.nightly_price)}</Text>{selectedInfo.external ? <Text style={styles.externalNote}>{de ? 'Dieser Tag ist durch einen externen iCal-Kalender blockiert.' : 'This date is blocked by an external iCal calendar.'}</Text> : null}{selectedInfo.row?.booking_id ? <Text style={styles.externalNote}>{de ? 'Dieser Tag gehört zu einer echten Buchung und kann nicht manuell freigegeben werden.' : 'This date belongs to a real booking and cannot be manually released.'}</Text> : null}</Card> : null}
      <FormField label={de ? 'Bis Datum (einschließlich)' : 'End date (inclusive)'} value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" autoCapitalize="none" />
      <Text style={styles.fieldLabel}>{de ? 'Status' : 'Status'}</Text><Segments accent="holz" value={status} onChange={(v) => setStatus(v as any)} items={[{ key:'available', label: de?'Verfügbar':'Available' },{ key:'blocked', label: de?'Gesperrt':'Blocked' }]} />
      <FormField label={de ? 'Sonderpreis pro Nacht (€) – optional' : 'Nightly price override (€) – optional'} value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder={de ? 'Leer = dynamischer Preis' : 'Blank = dynamic price'} />
      <FormField label={de ? 'Interne Notiz' : 'Internal note'} value={note} onChangeText={setNote} multiline />
      <Button variant="holz" loading={busy} title={de ? 'Zeitraum speichern' : 'Save range'} onPress={saveRange} />
      {selectedInfo?.row?.price_override != null ? <View style={{ marginTop: 10 }}><Button variant="secondary" loading={busy} title={de ? 'Sonderpreis entfernen' : 'Clear price override'} onPress={clearOverride} /></View> : null}
    </ModalSheet>
  </>;
}

const styles = StyleSheet.create({
  monthNav: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:16 }, month: { color:colors.text, fontSize:17, fontWeight:'900', textTransform:'capitalize' },
  week: { flexDirection:'row' }, weekText: { width:'14.285%', textAlign:'center', color:colors.muted, fontSize:11, fontWeight:'800', paddingBottom:7 }, grid: { flexDirection:'row', flexWrap:'wrap' },
  cell: { width:'14.285%', aspectRatio:0.88, padding:5, borderWidth:StyleSheet.hairlineWidth, borderColor:colors.border, backgroundColor:colors.surface, minHeight:50 }, booked: { backgroundColor:colors.holz }, blocked: { backgroundColor:colors.muted }, external: { backgroundColor:colors.info },
  dayNum: { color:colors.text, fontWeight:'800', fontSize:12 }, rate: { color:colors.holz, fontWeight:'900', fontSize:10, marginTop:5 }, marker: { color:colors.white, fontSize:9, marginTop:2 },
  legend: { flexDirection:'row', flexWrap:'wrap', gap:12, marginTop:14 }, legendText: { color:colors.muted, fontSize:11, fontWeight:'700' }, fieldLabel: { color:colors.text, fontSize:13, fontWeight:'800', marginBottom:8 }, current: { color:colors.text, fontWeight:'800' }, externalNote: { color:colors.muted, fontSize:12, lineHeight:18, marginTop:8 },
});
