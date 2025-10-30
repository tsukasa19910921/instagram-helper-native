// 🚨 重要: これらは必ず最上部でインポートすること
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { setupI18n } from './src/i18n';

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

  // i18n初期化完了まで何も表示しない（チラつき防止）
  // 必要に応じてスプラッシュ画面やローディングインジケータを表示可能
  if (!i18nReady) {
    return null;
  }

  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}
