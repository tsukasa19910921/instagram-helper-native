// 🚨 重要: これらは必ず最上部でインポートすること
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import AppNavigator from './src/navigation/AppNavigator';
import { setupI18n } from './src/i18n';

// スプラッシュ画面が自動で非表示にならないようにする
// これにより、初期化完了まで明示的に制御できます
SplashScreen.preventAutoHideAsync();

/**
 * Instagram投稿ジェネレーター - メインアプリコンポーネント
 * AIが写真を解析して、Instagram投稿文を自動生成します
 *
 * 多言語対応:
 * - i18nの初期化完了まで描画を遅延してチラつきを防止
 * - デバイス言語の自動検出と永続化
 */
export default function App() {
  // i18n初期化の完了状態
  const [i18nReady, setI18nReady] = useState(false);

  // アプリ起動時にi18nを初期化
  useEffect(() => {
    (async () => {
      try {
        await setupI18n();
        console.log('✅ i18n初期化完了');
      } catch (error) {
        console.error('❌ i18n初期化エラー:', error);
        // エラーが発生してもアプリは起動させる（デフォルト言語で）
      } finally {
        setI18nReady(true);
      }
    })();
  }, []);

  // 初期化完了後にスプラッシュ画面を非表示にする
  const onLayoutRootView = useCallback(async () => {
    if (i18nReady) {
      // スプラッシュ画面を非表示にする（アニメーション付き）
      await SplashScreen.hideAsync();
      console.log('✅ スプラッシュ画面を非表示にしました');
    }
  }, [i18nReady]);

  // i18n初期化完了まで何も表示しない（チラつき防止）
  // スプラッシュ画面は preventAutoHideAsync() により表示されたまま
  if (!i18nReady) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <AppNavigator />
      <StatusBar style="auto" />
    </View>
  );
}
