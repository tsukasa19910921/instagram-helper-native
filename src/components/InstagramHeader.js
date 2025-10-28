/**
 * Instagram風グラデーションヘッダー
 *
 * 修正内容:
 * - StatusBarをlightに設定（可読性向上）
 * - Instagramロゴを避けてカメラアイコンに変更（ブランドガイドライン対応）
 * - React.memoでパフォーマンス最適化
 * - ダークモード対応
 */
import React, { memo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../constants/colors';

export const InstagramHeader = memo(() => {
  const colors = useThemeColors();

  return (
    <LinearGradient
      colors={colors.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      {/* StatusBar を light に設定（グラデーション背景で可読性確保） */}
      <StatusBar style="light" />

      <View style={styles.headerContent}>
        {/* Instagramロゴではなくカメラアイコンを使用（ブランドガイドライン対応） */}
        <Ionicons name="camera" size={48} color="#fff" />
        <Text style={styles.headerTitle}>Instagram Helper</Text>
        <Text style={styles.headerSubtitle}>
          投稿を効率化するAIアシスタント
        </Text>
      </View>
    </LinearGradient>
  );
});

InstagramHeader.displayName = 'InstagramHeader';

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40, // ステータスバー分のパディング
    paddingBottom: 32,
    paddingHorizontal: 20,
    alignItems: 'center'
  },
  headerContent: {
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4
  }
});
