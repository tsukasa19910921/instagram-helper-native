/**
 * Instagram風グラデーションボタン
 *
 * 修正内容:
 * - 二重ラップで影の問題を解決（iOS対応）
 * - React.memo でパフォーマンス最適化
 * - アクセシビリティ対応強化
 * - ダークモード対応
 */
import React, { memo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../constants/colors';

export const InstagramButton = memo(({
  onPress,
  title,
  disabled = false,
  icon = null,
  style = {},
  accessibilityLabel,
  accessibilityHint
}) => {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[styles.touchable, style]}
      // アクセシビリティ対応
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
    >
      {/* 外側: 影を持つラッパー */}
      <View style={[
        styles.shadowWrapper,
        disabled && styles.shadowWrapperDisabled
      ]}>
        {/* 内側: グラデーション + overflow:hidden */}
        <LinearGradient
          colors={disabled ? ['#c7c7cc', '#c7c7cc'] : colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientInner}
        >
          <View style={styles.content}>
            {icon && <View style={styles.icon}>{icon}</View>}
            <Text style={styles.text}>{title}</Text>
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // カスタム比較関数（パフォーマンス最適化）
  return (
    prevProps.disabled === nextProps.disabled &&
    prevProps.title === nextProps.title &&
    prevProps.icon === nextProps.icon
  );
});

InstagramButton.displayName = 'InstagramButton';

const styles = StyleSheet.create({
  touchable: {
    // タップ領域の最小サイズを確保（アクセシビリティ）
    minHeight: 44
  },
  shadowWrapper: {
    borderRadius: 12,
    // 影はここに付ける（二重ラップパターン）
    ...Platform.select({
      ios: {
        shadowColor: '#dc2743',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8 // 8以下推奨（パフォーマンス）
      },
      android: {
        elevation: 8
      }
    })
  },
  shadowWrapperDisabled: {
    ...Platform.select({
      ios: {
        shadowOpacity: 0.1
      },
      android: {
        elevation: 2
      }
    })
  },
  gradientInner: {
    // overflow: hidden はここ
    borderRadius: 12,
    overflow: 'hidden',
    paddingVertical: 16,
    paddingHorizontal: 32
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  icon: {
    marginRight: 8
  },
  text: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center'
  }
});
