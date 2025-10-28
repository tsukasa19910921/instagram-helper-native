// 🚨 重要: これらは必ず最上部でインポートすること
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';

/**
 * Instagram投稿ジェネレーター - メインアプリコンポーネント
 * AIが写真を解析して、Instagram投稿文を自動生成します
 */
export default function App() {
  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}
