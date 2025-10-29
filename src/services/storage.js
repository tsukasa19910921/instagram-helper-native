// ローカルストレージサービス（AsyncStorage使用）
// 設定の保存・読み込みのみ（ミニマム版）
import AsyncStorage from '@react-native-async-storage/async-storage';

// ストレージキーの定義
const STORAGE_KEYS = {
  SETTINGS: '@instagram_settings'
};

/**
 * 設定を保存する
 * @param {Object} settings - 保存する設定オブジェクト
 */
export const saveSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    console.log('設定を保存しました:', settings);
  } catch (error) {
    console.error('Save settings error:', error);
    throw new Error('設定の保存に失敗しました');
  }
};

/**
 * 設定を取得する
 * @returns {Promise<Object>} 設定オブジェクト
 */
export const getSettings = async () => {
  try {
    const settings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);

    if (settings) {
      const parsedSettings = JSON.parse(settings);
      console.log('設定を取得しました');
      return parsedSettings;
    }

    // デフォルト設定
    const defaultSettings = {
      defaultTone: 'serious',
      defaultStyle: 'neutral',
      defaultHashtagAmount: 'normal',
      defaultLanguage: 'japanese',
      defaultImageStyle: 'original'
    };

    console.log('デフォルト設定を返します');
    return defaultSettings;
  } catch (error) {
    console.error('Get settings error:', error);
    // エラーの場合もデフォルト設定を返す
    return {
      defaultTone: 'serious',
      defaultStyle: 'neutral',
      defaultHashtagAmount: 'normal',
      defaultLanguage: 'japanese',
      defaultImageStyle: 'original'
    };
  }
};
