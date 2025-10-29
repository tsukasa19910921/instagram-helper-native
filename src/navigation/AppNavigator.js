// アプリケーションナビゲーション設定（ミニマム版）
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// 画面コンポーネントのインポート
import HomeScreen from '../screens/HomeScreen';

const Stack = createStackNavigator();

/**
 * メインナビゲーター
 * HomeScreen 1画面のみのシンプル構成
 */
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
