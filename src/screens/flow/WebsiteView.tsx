import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Badge, Button, Card, EmptyState, ErrorBanner, FormField, LoadingBlock, ModalSheet, Segments, ToggleRow } from '../../components/ui';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabase';
import { colors, radius, spacing } from '../../theme';

type Mode = 'content' | 'testimonials' | 'gallery';
type Settings = Record<string, any>;
type Testimonial = { id: string; customer_name: string; customer_context: string; quote: string; rating: number; published: boolean; sort_order: number };
type Gallery = { id: string; title: string; alt_text: string; category: string; storage_path: string; active: boolean; sort_order: number };

export function WebsiteView() {
  const { language } = useLanguage();
  const [mode, setMode] = useState<Mode>('content');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [gallery, setGallery] = useState<Gallery[]>([]);
  const [editTestimonial, setEditTestimonial] = useState<Partial<Testimonial> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [s, t, g] = await Promise.all([
      supabase.from('frankiflow_site_settings').select('*').eq('id', 1).single(),
      supabase.from('frankiflow_testimonials').select('*').order('sort_order'),
      supabase.from('frankiflow_gallery').select('*').order('sort_order'),
    ]);
    if (s.error || t.error || g.error) setError(s.error?.message ?? t.error?.message ?? g.error?.message ?? 'Load failed');
    else { setSettings(s.data); setTestimonials((t.data ?? []) as Testimonial[]); setGallery((g.data ?? []) as Gallery[]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function patch(key: string, value: any) { setSettings((prev) => prev ? { ...prev, [key]: value } : prev); }

  async function saveSettings() {
    if (!settings) return;
    setSaving(true); setError(null); setSuccess(null);
    const allowed = ['hero_eyebrow','hero_eyebrow_en','hero_title','hero_title_en','hero_subtitle','hero_subtitle_en','service_area','service_area_en','offer_title','offer_title_en','offer_text','offer_text_en','primary_cta_label','primary_cta_label_en','secondary_cta_label','secondary_cta_label_en','phone','email','whatsapp_url','calculator_url','legal_owner','legal_street','legal_postcode_city','hero_image_path'];
    const payload: Record<string, any> = {};
    allowed.forEach((k) => { payload[k] = settings[k] ?? ''; });
    const { error: e } = await supabase.from('frankiflow_site_settings').update(payload).eq('id', 1);
    setSaving(false);
    if (e) setError(e.message); else setSuccess(language === 'de' ? 'Webseiten-Inhalte gespeichert.' : 'Website content saved.');
  }

  async function saveTestimonial() {
    if (!editTestimonial?.customer_name?.trim() || !editTestimonial.quote?.trim()) return;
    setSaving(true);
    const payload = { customer_name: editTestimonial.customer_name.trim(), customer_context: editTestimonial.customer_context ?? '', quote: editTestimonial.quote.trim(), rating: Number(editTestimonial.rating ?? 5), published: editTestimonial.published ?? true, sort_order: Number(editTestimonial.sort_order ?? testimonials.length) };
    const q = editTestimonial.id ? supabase.from('frankiflow_testimonials').update(payload).eq('id', editTestimonial.id) : supabase.from('frankiflow_testimonials').insert(payload);
    const { error: e } = await q;
    setSaving(false);
    if (e) setError(e.message); else { setEditTestimonial(null); await load(); }
  }

  async function deleteTestimonial(item: Testimonial) {
    Alert.alert(language === 'de' ? 'Bewertung löschen?' : 'Delete testimonial?', item.customer_name, [
      { text: language === 'de' ? 'Abbrechen' : 'Cancel', style: 'cancel' },
      { text: language === 'de' ? 'Löschen' : 'Delete', style: 'destructive', onPress: async () => { const { error: e } = await supabase.from('frankiflow_testimonials').delete().eq('id', item.id); if (e) setError(e.message); else load(); } },
    ]);
  }

  async function pickAndUpload(hero = false) {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { setError(language === 'de' ? 'Fotozugriff wurde nicht erlaubt.' : 'Photo library access was not granted.'); return; }
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.86, allowsEditing: hero, aspect: hero ? [16, 9] : undefined });
    if (picked.canceled || !picked.assets[0]) return;
    setUploading(true); setError(null);
    try {
      const asset = picked.assets[0];
      const response = await fetch(asset.uri);
      const bytes = await response.arrayBuffer();
      const ext = (asset.fileName?.split('.').pop() || asset.mimeType?.split('/').pop() || 'jpg').replace('jpeg', 'jpg');
      const path = `${hero ? 'site' : 'gallery'}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upError } = await supabase.storage.from('frankiflow-media').upload(path, bytes, { contentType: asset.mimeType ?? 'image/jpeg', upsert: false });
      if (upError) throw upError;
      if (hero) {
        const { error: e } = await supabase.from('frankiflow_site_settings').update({ hero_image_path: path }).eq('id', 1);
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from('frankiflow_gallery').insert({ storage_path: path, title: asset.fileName ?? 'FrankiFlow', alt_text: 'FrankiFlow cleaning', category: 'general', active: true, sort_order: gallery.length });
        if (e) throw e;
      }
      await load();
    } catch (e: any) { setError(e?.message ?? 'Upload failed'); }
    finally { setUploading(false); }
  }

  async function deleteGallery(item: Gallery) {
    Alert.alert(language === 'de' ? 'Bild löschen?' : 'Delete image?', item.title, [
      { text: language === 'de' ? 'Abbrechen' : 'Cancel', style: 'cancel' },
      { text: language === 'de' ? 'Löschen' : 'Delete', style: 'destructive', onPress: async () => {
        const storage = await supabase.storage.from('frankiflow-media').remove([item.storage_path]);
        if (storage.error) { setError(storage.error.message); return; }
        const { error: e } = await supabase.from('frankiflow_gallery').delete().eq('id', item.id);
        if (e) setError(e.message); else load();
      } },
    ]);
  }

  if (loading) return <LoadingBlock />;

  return <View>
    <ErrorBanner message={error} />
    {success ? <View style={styles.success}><Text style={styles.successText}>{success}</Text></View> : null}
    <Segments value={mode} onChange={(x) => setMode(x as Mode)} items={[{ key:'content', label: language === 'de' ? 'Inhalte' : 'Content' }, { key:'testimonials', label: language === 'de' ? 'Bewertungen' : 'Testimonials' }, { key:'gallery', label: language === 'de' ? 'Galerie' : 'Gallery' }]} />

    {mode === 'content' && settings ? <>
      <Card>
        <Text style={styles.cardTitle}>Hero · Deutsch</Text>
        <FormField label="Eyebrow" value={settings.hero_eyebrow ?? ''} onChangeText={(v) => patch('hero_eyebrow', v)} />
        <FormField label="Titel" value={settings.hero_title ?? ''} onChangeText={(v) => patch('hero_title', v)} />
        <FormField label="Untertitel" value={settings.hero_subtitle ?? ''} onChangeText={(v) => patch('hero_subtitle', v)} multiline />
        <FormField label="Servicegebiet" value={settings.service_area ?? ''} onChangeText={(v) => patch('service_area', v)} />
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Hero · English</Text>
        <FormField label="Eyebrow" value={settings.hero_eyebrow_en ?? ''} onChangeText={(v) => patch('hero_eyebrow_en', v)} />
        <FormField label="Title" value={settings.hero_title_en ?? ''} onChangeText={(v) => patch('hero_title_en', v)} />
        <FormField label="Subtitle" value={settings.hero_subtitle_en ?? ''} onChangeText={(v) => patch('hero_subtitle_en', v)} multiline />
        <FormField label="Service area" value={settings.service_area_en ?? ''} onChangeText={(v) => patch('service_area_en', v)} />
      </Card>
      <Card>
        <Text style={styles.cardTitle}>{language === 'de' ? 'Hero-Foto' : 'Hero image'}</Text>
        {settings.hero_image_path ? <Image style={styles.hero} source={{ uri: supabase.storage.from('frankiflow-media').getPublicUrl(settings.hero_image_path).data.publicUrl }} /> : null}
        <Button variant="secondary" title={language === 'de' ? 'Hero-Foto auswählen' : 'Choose hero image'} onPress={() => pickAndUpload(true)} loading={uploading} />
      </Card>
      <Card>
        <Text style={styles.cardTitle}>{language === 'de' ? 'Angebot' : 'Offer'}</Text>
        <FormField label="Titel DE" value={settings.offer_title ?? ''} onChangeText={(v) => patch('offer_title', v)} />
        <FormField label="Text DE" value={settings.offer_text ?? ''} onChangeText={(v) => patch('offer_text', v)} multiline />
        <FormField label="Title EN" value={settings.offer_title_en ?? ''} onChangeText={(v) => patch('offer_title_en', v)} />
        <FormField label="Text EN" value={settings.offer_text_en ?? ''} onChangeText={(v) => patch('offer_text_en', v)} multiline />
      </Card>
      <Card>
        <Text style={styles.cardTitle}>{language === 'de' ? 'Kontakt & Links' : 'Contact & links'}</Text>
        <FormField label="Telefon" value={settings.phone ?? ''} onChangeText={(v) => patch('phone', v)} />
        <FormField label="E-Mail" value={settings.email ?? ''} onChangeText={(v) => patch('email', v)} />
        <FormField label="WhatsApp URL" value={settings.whatsapp_url ?? ''} onChangeText={(v) => patch('whatsapp_url', v)} autoCapitalize="none" />
        <FormField label="Calculator URL" value={settings.calculator_url ?? ''} onChangeText={(v) => patch('calculator_url', v)} autoCapitalize="none" />
        <FormField label="Primary CTA DE" value={settings.primary_cta_label ?? ''} onChangeText={(v) => patch('primary_cta_label', v)} />
        <FormField label="Primary CTA EN" value={settings.primary_cta_label_en ?? ''} onChangeText={(v) => patch('primary_cta_label_en', v)} />
        <FormField label="Secondary CTA DE" value={settings.secondary_cta_label ?? ''} onChangeText={(v) => patch('secondary_cta_label', v)} />
        <FormField label="Secondary CTA EN" value={settings.secondary_cta_label_en ?? ''} onChangeText={(v) => patch('secondary_cta_label_en', v)} />
      </Card>
      <Button title={language === 'de' ? 'Webseiten-Inhalte speichern' : 'Save website content'} onPress={saveSettings} loading={saving} />
    </> : null}

    {mode === 'testimonials' ? <>
      <View style={styles.action}><Button compact title={language === 'de' ? '+ Bewertung' : '+ Testimonial'} onPress={() => setEditTestimonial({ customer_name:'', customer_context:'', quote:'', rating:5, published:true, sort_order:testimonials.length })} /></View>
      {testimonials.length === 0 ? <EmptyState title={language === 'de' ? 'Keine Bewertungen' : 'No testimonials'} /> : testimonials.map((t) => <Pressable key={t.id} onPress={() => setEditTestimonial(t)}><Card style={styles.testCard}><View style={styles.row}><View style={{ flex:1 }}><Text style={styles.name}>{t.customer_name}</Text><Text style={styles.stars}>{'★'.repeat(Math.max(1, Math.min(5, Number(t.rating))))}</Text><Text numberOfLines={2} style={styles.quote}>“{t.quote}”</Text></View><Badge text={t.published ? (language === 'de' ? 'Online' : 'Published') : (language === 'de' ? 'Entwurf' : 'Draft')} tone={t.published ? 'success' : 'neutral'} /></View></Card></Pressable>)}
    </> : null}

    {mode === 'gallery' ? <>
      <View style={styles.action}><Button compact title={language === 'de' ? '+ Foto' : '+ Photo'} onPress={() => pickAndUpload(false)} loading={uploading} /></View>
      {gallery.length === 0 ? <EmptyState title={language === 'de' ? 'Noch keine Galerie-Fotos' : 'No gallery photos yet'} /> : <View style={styles.galleryGrid}>{gallery.map((g) => { const url = supabase.storage.from('frankiflow-media').getPublicUrl(g.storage_path).data.publicUrl; return <View key={g.id} style={styles.galleryItem}><Image source={{ uri:url }} style={styles.galleryImage} /><View style={styles.galleryMeta}><Text numberOfLines={1} style={styles.galleryTitle}>{g.title || 'FrankiFlow'}</Text><Pressable onPress={() => deleteGallery(g)}><Text style={styles.delete}>×</Text></Pressable></View></View>; })}</View>}
    </> : null}

    <ModalSheet visible={Boolean(editTestimonial)} title={editTestimonial?.id ? (language === 'de' ? 'Bewertung bearbeiten' : 'Edit testimonial') : (language === 'de' ? 'Neue Bewertung' : 'New testimonial')} onClose={() => setEditTestimonial(null)}>
      {editTestimonial ? <>
        <FormField label={language === 'de' ? 'Kundenname *' : 'Customer name *'} value={editTestimonial.customer_name ?? ''} onChangeText={(v) => setEditTestimonial({ ...editTestimonial, customer_name:v })} />
        <FormField label={language === 'de' ? 'Kontext' : 'Context'} value={editTestimonial.customer_context ?? ''} onChangeText={(v) => setEditTestimonial({ ...editTestimonial, customer_context:v })} placeholder="Büroreinigung · Frankfurt" />
        <FormField label={language === 'de' ? 'Bewertung *' : 'Quote *'} value={editTestimonial.quote ?? ''} onChangeText={(v) => setEditTestimonial({ ...editTestimonial, quote:v })} multiline />
        <FormField label={language === 'de' ? 'Sterne (1–5)' : 'Rating (1–5)'} keyboardType="number-pad" value={String(editTestimonial.rating ?? 5)} onChangeText={(v) => setEditTestimonial({ ...editTestimonial, rating:Math.max(1,Math.min(5,Number(v)||1)) })} />
        <ToggleRow label={language === 'de' ? 'Veröffentlicht' : 'Published'} value={editTestimonial.published ?? true} onValueChange={(v) => setEditTestimonial({ ...editTestimonial, published:v })} />
        <Button title={language === 'de' ? 'Speichern' : 'Save'} onPress={saveTestimonial} loading={saving} />
        {editTestimonial.id ? <View style={{ marginTop:10 }}><Button variant="danger" title={language === 'de' ? 'Bewertung löschen' : 'Delete testimonial'} onPress={() => deleteTestimonial(editTestimonial as Testimonial)} /></View> : null}
      </> : null}
    </ModalSheet>
  </View>;
}

const styles = StyleSheet.create({
  success: { padding:12, backgroundColor:colors.successSoft, borderRadius:10, marginBottom:12 },
  successText: { color:colors.success, fontWeight:'800', fontSize:12 },
  cardTitle: { color:colors.text, fontWeight:'900', fontSize:16, marginBottom:12 },
  hero: { width:'100%', aspectRatio:16/9, borderRadius:radius.md, marginBottom:12, backgroundColor:colors.surfaceAlt },
  action: { alignItems:'flex-end', marginBottom:10 },
  testCard: { padding:14, marginBottom:9 },
  row: { flexDirection:'row', alignItems:'flex-start', gap:10 },
  name: { color:colors.text, fontWeight:'900', fontSize:14 },
  stars: { color:colors.holz, marginTop:3, letterSpacing:1 },
  quote: { color:colors.muted, fontSize:12, lineHeight:18, marginTop:6 },
  galleryGrid: { flexDirection:'row', flexWrap:'wrap', gap:10 },
  galleryItem: { width:'48.5%', backgroundColor:colors.surface, borderRadius:radius.md, borderWidth:1, borderColor:colors.border, overflow:'hidden' },
  galleryImage: { width:'100%', aspectRatio:1.25, backgroundColor:colors.surfaceAlt },
  galleryMeta: { flexDirection:'row', alignItems:'center', gap:6, padding:9 },
  galleryTitle: { flex:1, color:colors.text, fontWeight:'800', fontSize:11 },
  delete: { color:colors.danger, fontSize:22, lineHeight:20 },
});
