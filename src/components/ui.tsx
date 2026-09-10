import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radius, spacing } from '../theme';

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  compact,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'holz';
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
}) {
  const bg = variant === 'primary' ? colors.primary
    : variant === 'holz' ? colors.holz
      : variant === 'danger' ? colors.danger
        : variant === 'secondary' ? colors.surfaceAlt
          : 'transparent';
  const fg = variant === 'primary' || variant === 'holz' || variant === 'danger' ? colors.white : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        { backgroundColor: bg, borderColor: variant === 'ghost' ? colors.border : bg },
        pressed && { opacity: 0.86, transform: [{ scale: 0.985 }] },
        (disabled || loading) && { opacity: 0.55 },
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={fg} /> : <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}

export function FormField({ label, multiline, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={colors.muted}
        selectionColor={colors.accent}
        style={[styles.input, multiline && styles.multiline, props.style]}
      />
    </View>
  );
}

export function ToggleRow({ label, value, onValueChange, description }: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  description?: string;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {description ? <Text style={styles.toggleDesc}>{description}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: colors.surfaceMuted, true: colors.accentSoft }} thumbColor={value ? colors.accent : colors.muted} />
    </View>
  );
}

export function MetricCard({ label, value, hint, accent = 'flow' }: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: 'flow' | 'holz' | 'neutral' | 'danger';
}) {
  const accentColor = accent === 'holz' ? colors.holz : accent === 'danger' ? colors.danger : accent === 'neutral' ? colors.muted : colors.primary;
  const softColor = accent === 'holz' ? colors.holzSoft : accent === 'danger' ? colors.dangerSoft : accent === 'neutral' ? colors.surfaceAlt : colors.primarySoft;
  return (
    <View style={[styles.metricCard, { backgroundColor: softColor }]}> 
      <View style={[styles.metricIcon, { backgroundColor: accentColor }]} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {hint ? <Text style={styles.metricHint}>{hint}</Text> : null}
    </View>
  );
}

export function Badge({ text, tone = 'neutral' }: { text: string; tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'holz' }) {
  const palette = tone === 'success' ? [colors.successSoft, colors.success]
    : tone === 'warning' ? [colors.warningSoft, colors.warning]
      : tone === 'danger' ? [colors.dangerSoft, colors.danger]
        : tone === 'info' ? [colors.infoSoft, colors.info]
          : tone === 'holz' ? [colors.holzSoft, colors.holzDark]
            : [colors.surfaceAlt, colors.muted];
  return (
    <View style={[styles.badge, { backgroundColor: palette[0] }]}>
      <View style={[styles.badgeDot, { backgroundColor: palette[1] }]} />
      <Text style={[styles.badgeText, { color: palette[1] }]}>{text}</Text>
    </View>
  );
}

export function Segments({ items, value, onChange, accent = 'flow' }: {
  items: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
  accent?: 'flow' | 'holz';
}) {
  const activeColor = accent === 'holz' ? colors.holzDark : colors.primary;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.segmentScroll}>
      {items.map((item) => {
        const active = item.key === value;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            style={({ pressed }) => [styles.segment, active && { backgroundColor: activeColor, borderColor: activeColor }, pressed && { opacity: 0.78 }]}
          >
            <Text style={[styles.segmentText, active && { color: colors.white }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <Card style={styles.empty}>
      <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>·</Text></View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.emptyText}>{message}</Text> : null}
    </Card>
  );
}

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.loadingBlock}>
      <ActivityIndicator color={colors.accent} />
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorSymbol}>!</Text>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

export function ModalSheet({ visible, title, onClose, children }: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <View style={styles.modalHandle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={10} style={styles.modalCloseButton}><Text style={styles.modalClose}>×</Text></Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

export function KeyValue({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvLabel}>{label}</Text>
      {typeof value === 'string' || typeof value === 'number'
        ? <Text selectable style={[styles.kvValue, mono && { fontFamily: 'monospace' }]}>{value}</Text>
        : <View style={{ alignItems: 'flex-end', flex: 1 }}>{value}</View>}
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.statGrid}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.065,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: 2, marginBottom: spacing.md },
  sectionTitle: { fontSize: 19, fontWeight: '900', color: colors.text, letterSpacing: -0.45 },
  sectionSubtitle: { fontSize: 12.5, lineHeight: 18, color: colors.muted, marginTop: 3 },
  button: { minHeight: 50, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', shadowColor: colors.primaryDark, shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  buttonCompact: { minHeight: 38, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 13 },
  buttonText: { fontSize: 14, fontWeight: '900', letterSpacing: -0.1 },
  fieldWrap: { marginBottom: spacing.md },
  label: { color: colors.text, fontWeight: '800', fontSize: 12.5, marginBottom: 7 },
  input: { minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.surfaceAlt, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 12 },
  toggleLabel: { color: colors.text, fontSize: 14.5, fontWeight: '800' },
  toggleDesc: { color: colors.muted, fontSize: 12, marginTop: 3, lineHeight: 17 },
  metricCard: { width: '48.5%', minHeight: 116, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, padding: 15, overflow: 'hidden' },
  metricIcon: { width: 28, height: 5, borderRadius: radius.pill, marginBottom: 12 },
  metricLabel: { color: colors.muted, fontSize: 11.5, fontWeight: '800' },
  metricValue: { color: colors.text, fontSize: 25, fontWeight: '900', marginTop: 7, letterSpacing: -0.8 },
  metricHint: { color: colors.muted, fontSize: 10.5, marginTop: 4 },
  badge: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeDot: { width: 5, height: 5, borderRadius: 99 },
  badgeText: { fontSize: 10.5, fontWeight: '900', letterSpacing: 0.1 },
  segmentScroll: { gap: 8, paddingBottom: 16, paddingRight: 8 },
  segment: { borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 9, shadowColor: colors.primaryDark, shadowOpacity: 0.025, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  segmentText: { fontSize: 11.5, fontWeight: '900', color: colors.text },
  empty: { alignItems: 'center', paddingVertical: 30 },
  emptyIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  emptyIconText: { color: colors.accent, fontSize: 28, lineHeight: 25, fontWeight: '900' },
  emptyTitle: { color: colors.text, fontWeight: '900', fontSize: 16 },
  emptyText: { color: colors.muted, textAlign: 'center', fontSize: 13, lineHeight: 19, marginTop: 6 },
  loadingBlock: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, paddingVertical: 30 },
  loadingText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  errorBanner: { backgroundColor: colors.dangerSoft, borderRadius: 16, padding: 12, marginBottom: spacing.md, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  errorSymbol: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.danger, color: colors.white, textAlign: 'center', lineHeight: 22, fontWeight: '900' },
  errorText: { color: colors.danger, fontWeight: '750', fontSize: 12.5, lineHeight: 18, flex: 1 },
  modalRoot: { flex: 1, backgroundColor: colors.bg },
  modalHandle: { width: 42, height: 5, borderRadius: 99, backgroundColor: colors.border, alignSelf: 'center', marginTop: 9 },
  modalHeader: { minHeight: 66, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, backgroundColor: colors.bg },
  modalTitle: { flex: 1, color: colors.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.5, paddingRight: 10 },
  modalCloseButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  modalClose: { color: colors.text, fontSize: 27, fontWeight: '300', lineHeight: 29 },
  modalContent: { padding: spacing.lg, paddingTop: 6, paddingBottom: 70 },
  kvRow: { flexDirection: 'row', gap: 12, paddingVertical: 10, alignItems: 'flex-start', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  kvLabel: { color: colors.muted, fontSize: 11.5, fontWeight: '800', width: 110 },
  kvValue: { color: colors.text, fontSize: 12.5, fontWeight: '700', textAlign: 'right', flex: 1 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 10 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: spacing.lg },
});
