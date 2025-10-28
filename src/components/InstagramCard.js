/**
 * Instagram風カードコンポーネント
 *
 * WEBアプリのカードUIを再現
 * - 丸みのある角
 * - シャドウ効果
 * - ダークモード対応
 */
import React, { memo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useThemeColors } from '../constants/colors';

export const InstagramCard = memo(({ children, style = {} }) => {
  const colors = useThemeColors();

  return (
    <View style={[
      styles.card,
      { backgroundColor: colors.cardBackground },
      style
    ]}>
      {children}
    </View>
  );
});

InstagramCard.displayName = 'InstagramCard';

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8
      },
      android: {
        elevation: 5
      }
    })
  }
});
