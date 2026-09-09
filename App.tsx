import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LanguageProvider, useLanguage } from './src/context/LanguageContext';
import { FrankiFlowScreen } from './src/screens/FrankiFlowScreen';
import { FrankiHolzScreen } from './src/screens/FrankiHolzScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { colors } from './src/theme';

type Tab='home'|'flow'|'holz'|'settings';
function Shell(){
  const {loading,session,access}=useAuth(); const {language}=useLanguage(); const [tab,setTab]=useState<Tab>('home'); const de=language==='de';
  const items=useMemo(()=>[
    {key:'home' as Tab,label:de?'Übersicht':'Overview',icon:'⌂',show:true},
    {key:'flow' as Tab,label:'FrankiFlow',icon:'✓',show:access.frankiflow},
    {key:'holz' as Tab,label:'FrankiHolz',icon:'⌂',show:access.frankiholz},
    {key:'settings' as Tab,label:de?'Einstellungen':'Settings',icon:'⚙',show:true},
  ].filter(x=>x.show),[access.frankiflow,access.frankiholz,de]);
  if(loading)return <View style={styles.loading}><View style={styles.logo}><Text style={styles.logoText}>F</Text></View><ActivityIndicator color={colors.primary}/><Text style={styles.loadingText}>Franki Admin</Text></View>;
  if(!session)return <LoginScreen/>;
  const safeTab = (tab==='flow'&&!access.frankiflow)||(tab==='holz'&&!access.frankiholz)?'home':tab;
  return <SafeAreaView style={styles.root}><View style={styles.screen}>{safeTab==='home'?<HomeScreen onOpen={(x)=>setTab(x)}/>:safeTab==='flow'?<FrankiFlowScreen/>:safeTab==='holz'?<FrankiHolzScreen/>:<SettingsScreen/>}</View><View style={styles.nav}>{items.map(item=>{const active=item.key===safeTab;return <Pressable key={item.key} onPress={()=>setTab(item.key)} style={styles.navItem}><Text style={[styles.navIcon,active&&styles.navActive]}>{item.icon}</Text><Text numberOfLines={1} style={[styles.navLabel,active&&styles.navActive]}>{item.label}</Text>{active?<View style={styles.activeDot}/>:null}</Pressable>})}</View></SafeAreaView>;
}
export default function App(){return <LanguageProvider><AuthProvider><StatusBar style="dark"/><Shell/></AuthProvider></LanguageProvider>}
const styles=StyleSheet.create({root:{flex:1,backgroundColor:colors.bg,paddingTop:Platform.OS==='android'?24:0},screen:{flex:1},loading:{flex:1,backgroundColor:colors.bg,alignItems:'center',justifyContent:'center',gap:12},logo:{width:56,height:56,borderRadius:18,backgroundColor:colors.primary,alignItems:'center',justifyContent:'center',marginBottom:4},logoText:{color:colors.white,fontSize:28,fontWeight:'900'},loadingText:{color:colors.text,fontWeight:'900'},nav:{position:'absolute',left:12,right:12,bottom:Platform.OS==='ios'?20:12,minHeight:67,backgroundColor:colors.surface,borderRadius:20,borderWidth:StyleSheet.hairlineWidth,borderColor:colors.border,flexDirection:'row',alignItems:'stretch',shadowColor:'#000',shadowOpacity:.08,shadowRadius:15,shadowOffset:{width:0,height:5},elevation:8,overflow:'hidden'},navItem:{flex:1,alignItems:'center',justifyContent:'center',paddingHorizontal:4,paddingTop:7,paddingBottom:6},navIcon:{color:colors.muted,fontSize:17,fontWeight:'900'},navLabel:{color:colors.muted,fontSize:9,fontWeight:'800',marginTop:3},navActive:{color:colors.primary},activeDot:{width:18,height:3,borderRadius:999,backgroundColor:colors.primary,marginTop:4}});
