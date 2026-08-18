// FILE: mobile/src/components/nia/QuickPrompts.js
// Purpose: Suggested follow-up prompt pills for Nia chat
// Mobile adaptation: Horizontal ScrollView of pressable pill buttons

import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet, View } from 'react-native';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '../../constants/theme';

export default function QuickPrompts({ prompts = [], onSelect }) {
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
            style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}
            onPress={() => onSelect && onSelect(prompt)}
          >
            <Text style={styles.pillText}>{prompt}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: SPACING.sm,
  },
  row: {
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
  },
  pill: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderRadius: RADIUS.full,
    paddingVertical: 8,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
  },
  pillPressed: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
