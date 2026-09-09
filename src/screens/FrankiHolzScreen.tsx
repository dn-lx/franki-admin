import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Segments } from '../components/ui';
import { useLanguage } from '../context/LanguageContext';
import { colors, spacing } from '../theme';
import { BookingsView } from './holz/BookingsView';
import { CalendarView } from './holz/CalendarView';
import { RoomsView } from './holz/RoomsView';
import { PricingView } from './holz/PricingView';
import { IntegrationsView } from './holz/IntegrationsView';
import { HolzWebsiteView } from './holz/WebsiteView';

type Tab='bookings'|'calendar'|'rooms'|'pricing'|'website'|'sync';
export function FrankiHolzScreen(){const {language}=useLanguage();const de=language==='de';const [tab,setTab]=useState<Tab>('bookings');const items=[{key:'bookings',label:de?'Buchungen':'Bookings'},{key:'calendar',label:de?'Kalender':'Calendar'},{key:'rooms',label:de?'Zimmer':'Rooms'},{key:'pricing',label:de?'Preise':'Pricing'},{key:'website',label:de?'Webseite':'Website'},{key:'sync',label:'iCal / Airbnb'}];return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><Text style={styles.eyebrow}>FRANKIHOLZ</Text><Text style={styles.title}>{de?'Unterkunftsverwaltung':'Accommodation management'}</Text><Text style={styles.subtitle}>{de?'Buchungen, Kalender, Zimmer, dynamische Preise und Plattform-Synchronisierung.':'Bookings, calendar, rooms, dynamic pricing and platform sync.'}</Text><Segments accent="holz" value={tab} onChange={v=>setTab(v as Tab)} items={items}/><View style={styles.body}>{tab==='bookings'?<BookingsView/>:null}{tab==='calendar'?<CalendarView/>:null}{tab==='rooms'?<RoomsView/>:null}{tab==='pricing'?<PricingView/>:null}{tab==='website'?<HolzWebsiteView/>:null}{tab==='sync'?<IntegrationsView/>:null}</View></ScrollView>}
const styles=StyleSheet.create({content:{padding:spacing.lg,paddingBottom:110},eyebrow:{color:colors.holz,fontWeight:'900',fontSize:11,letterSpacing:1.25},title:{color:colors.text,fontSize:28,fontWeight:'900',letterSpacing:-.8,marginTop:5},subtitle:{color:colors.muted,fontSize:13,lineHeight:19,marginTop:4,marginBottom:20},body:{minHeight:500}});
