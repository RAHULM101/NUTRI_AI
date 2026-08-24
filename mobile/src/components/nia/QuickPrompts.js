import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic } from '../../utils/haptics';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '../../constants/theme';

export default function QuickPrompts({ prompts = [], onSelect }) {
  const { isDark, colors } = useTheme();

  if (!prompts || prompts.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {prompts.map((prompt, i) => (
          <Pressable
            key={i}
            style={({ pressed }) => [
              styles.pill,
              {
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
                borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.25)',
              },
              pressed && styles.pillPressed,
            ]}
            onPress={() => {
              triggerHaptic('light');
              onSelect && onSelect(prompt);
            }}
          >
            <Text style={[styles.pillText, { color: isDark ? '#34D399' : COLORS.primary }]}>{prompt}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: SPACING.xs,
  },
  row: {
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
  },
  pill: {
    borderRadius: RADIUS.full,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  pillPressed: {
    opacity: 0.75,
  },
  pillText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
