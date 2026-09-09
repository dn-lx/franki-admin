import React, { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge, Button, Card, ErrorBanner, KeyValue, SectionHeader, Segments } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { projectUrl } from '../lib/supabase';
import { colors, spacing } from '../theme';

export function SettingsScreen(){
  const {user,access,signOut,refreshAccess}=useAuth(); const {language,setLanguage}=useLanguage(); const de=language==='de'; const [busy,setBusy]=useState(false); const [error,setError]=useState<string|null>(null);
  async function refresh(){setBusy(true);setError(null);try{await refreshAccess();}catch(e:any){setError(e.message??String(e));}finally{setBusy(false);}}
  return <ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.eyebrow}>FRANKI ADMIN</Text><Text style={styles.title}>{de?'Einstellungen':'Settings'}</Text><Text style={styles.subtitle}>{de?'Konto, Sprache, Zugriffsrechte und App-Informationen.':'Account, language, access rights and app information.'}</Text><ErrorBanner message={error}/>
    <SectionHeader title={de?'Sprache':'Language'}/><Segments value={language} onChange={(v)=>setLanguage(v as 'de'|'en')} items={[{key:'de',label:'Deutsch'},{key:'en',label:'English'}]}/>
    <SectionHeader title={de?'Admin-Konto':'Admin account'}/><Card><KeyValue label="E-Mail" value={user?.email??'—'}/><KeyValue label={de?'FrankiFlow Zugriff':'FrankiFlow access'} value={<Badge text={access.frankiflow?(access.frankiflowRole??'admin'):(de?'Kein Zugriff':'No access')} tone={access.frankiflow?'success':'neutral'}/>}/><KeyValue label={de?'FrankiHolz Zugriff':'FrankiHolz access'} value={<Badge text={access.frankiholz?'admin':(de?'Kein Zugriff':'No access')} tone={access.frankiholz?'holz':'neutral'}/>} /></Card>
    <Button variant="secondary" loading={busy} title={de?'Zugriffsrechte neu prüfen':'Refresh permissions'} onPress={refresh}/>
    <View style={{height:22}}/><SectionHeader title={de?'Backend':'Backend'}/><Card><KeyValue label="Provider" value="Supabase"/><KeyValue label="Project" value="FrankiFlow & FrankiHolz Backend"/><KeyValue label="Region" value="eu-central-1"/><KeyValue label="Endpoint" value={projectUrl.replace('https://','')} mono/><Text style={styles.security}>{de?'Die App enthält nur den öffentlichen Supabase Publishable Key. Service-Role- und Stripe-Secret-Keys gehören niemals in die mobile App.':'The app contains only the public Supabase publishable key. Service-role and Stripe secret keys must never be stored in the mobile app.'}</Text></Card>
    <SectionHeader title={de?'App':'App'}/><Card><KeyValue label="Name" value="Franki Admin"/><KeyValue label="Version" value="1.0.0"/><KeyValue label="iOS" value="de.frankiflow.admin" mono/><KeyValue label="Android" value="de.frankiflow.admin" mono/></Card>
    <View style={styles.links}><Button compact variant="secondary" title="frankiflow.de ↗" onPress={()=>Linking.openURL('https://www.frankiflow.de')}/><Button compact variant="secondary" title="FrankiHolz ↗" onPress={()=>Linking.openURL('https://accommodation.frankiflow.de')}/></View>
    <View style={{height:28}}/><Button variant="danger" title={de?'Abmelden':'Sign out'} onPress={signOut}/>
  </ScrollView>;
}
const styles=StyleSheet.create({content:{padding:spacing.lg,paddingBottom:110},eyebrow:{color:colors.primary,fontWeight:'900',fontSize:11,letterSpacing:1.25},title:{color:colors.text,fontSize:28,fontWeight:'900',letterSpacing:-.8,marginTop:5},subtitle:{color:colors.muted,fontSize:13,lineHeight:19,marginTop:4,marginBottom:22},security:{color:colors.muted,fontSize:11,lineHeight:17,marginTop:12},links:{flexDirection:'row',gap:8,flexWrap:'wrap'}});
