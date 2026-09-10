import React, { useState } from 'react';
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { brand } from '../brand';
import { colors, radius } from '../theme';

type Kind = 'frankiflow' | 'frankiholz';

export function BrandLogo({ kind, compact = false, style }: { kind: Kind; compact?: boolean; style?: StyleProp<ViewStyle> }) {
  const [failed, setFailed] = useState(false);
  const item = brand[kind];
  const initials = kind === 'frankiflow' ? 'FF' : 'FH';

  return (
    <View style={[compact ? styles.compactWrap : styles.wrap, style]}>
      {!failed ? (
        <Image
          source={{ uri: item.logoUri }}
          resizeMode="contain"
          onError={() => setFailed(true)}
          style={compact ? styles.compactImage : styles.image}
          accessibilityLabel={`${item.name} logo`}
        />
      ) : (
        <View style={[compact ? styles.compactFallback : styles.fallback, kind === 'frankiholz' && styles.holzFallback]}>
          <Text style={[styles.fallbackText, compact && styles.compactFallbackText]}>{initials}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 190, height: 92, justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  compactWrap: { width: 84, height: 48, justifyContent: 'center' },
  compactImage: { width: '100%', height: '100%' },
  fallback: { width: 72, height: 72, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  holzFallback: { backgroundColor: colors.holz },
  compactFallback: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  fallbackText: { color: colors.white, fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  compactFallbackText: { fontSize: 13 },
});
