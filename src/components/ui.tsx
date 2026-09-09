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
        (pressed || disabled || loading) && { opacity: 0.65 },
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
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: colors.primarySoft }} thumbColor={value ? colors.primary : undefined} />
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
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricAccent, { backgroundColor: accentColor }]} />
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
          : tone === 'holz' ? [colors.holzSoft, colors.holz]
            : [colors.surfaceAlt, colors.muted];
  return (
    <View style={[styles.badge, { backgroundColor: palette[0] }]}>
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
  const activeColor = accent === 'holz' ? colors.holz : colors.primary;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.segmentScroll}>
      {items.map((item) => {
        const active = item.key === value;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            style={[styles.segment, active && { backgroundColor: activeColor, borderColor: activeColor }]}
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
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.emptyText}>{message}</Text> : null}
    </Card>
  );
}

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.loadingBlock}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.errorBanner}>
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
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={10}><Text style={styles.modalClose}>×</Text></Pressable>
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
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.035,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.35 },
  sectionSubtitle: { fontSize: 13, lineHeight: 18, color: colors.muted, marginTop: 3 },
  button: { minHeight: 46, paddingHorizontal: 17, paddingVertical: 11, borderRadius: radius.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  buttonCompact: { minHeight: 36, paddingHorizontal: 12, paddingVertical: 7 },
  buttonText: { fontSize: 14, fontWeight: '800' },
  fieldWrap: { marginBottom: spacing.md },
  label: { color: colors.text, fontWeight: '700', fontSize: 13, marginBottom: 7 },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surface, paddingHorizontal: 13, paddingVertical: 11, fontSize: 15, color: colors.text },
  multiline: { minHeight: 104, textAlignVertical: 'top' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 10 },
  toggleLabel: { color: colors.text, fontSize: 15, fontWeight: '700' },
  toggleDesc: { color: colors.muted, fontSize: 12, marginTop: 3, lineHeight: 17 },
  metricCard: { width: '48.5%', minHeight: 112, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, padding: 14, overflow: 'hidden' },
  metricAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  metricLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  metricValue: { color: colors.text, fontSize: 26, fontWeight: '900', marginTop: 7, letterSpacing: -0.7 },
  metricHint: { color: colors.muted, fontSize: 11, marginTop: 4 },
  badge: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 5 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  segmentScroll: { gap: 8, paddingBottom: 14 },
  segment: { borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 13, paddingVertical: 8 },
  segmentText: { fontSize: 12, fontWeight: '800', color: colors.text },
  empty: { alignItems: 'center', paddingVertical: 28 },
  emptyTitle: { color: colors.text, fontWeight: '800', fontSize: 16 },
  emptyText: { color: colors.muted, textAlign: 'center', fontSize: 13, lineHeight: 19, marginTop: 6 },
  loadingBlock: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, paddingVertical: 28 },
  loadingText: { color: colors.muted, fontSize: 13 },
  errorBanner: { backgroundColor: colors.dangerSoft, borderRadius: radius.sm, padding: 12, marginBottom: spacing.md },
  errorText: { color: colors.danger, fontWeight: '700', fontSize: 13, lineHeight: 18 },
  modalRoot: { flex: 1, backgroundColor: colors.bg },
  modalHeader: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, backgroundColor: colors.surface },
  modalTitle: { flex: 1, color: colors.text, fontSize: 20, fontWeight: '900', paddingRight: 10 },
  modalClose: { color: colors.text, fontSize: 32, fontWeight: '300' },
  modalContent: { padding: spacing.lg, paddingBottom: 60 },
  kvRow: { flexDirection: 'row', gap: 12, paddingVertical: 9, alignItems: 'flex-start' },
  kvLabel: { color: colors.muted, fontSize: 12, fontWeight: '700', width: 110 },
  kvValue: { color: colors.text, fontSize: 13, fontWeight: '600', textAlign: 'right', flex: 1 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 9 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: spacing.lg },
});
