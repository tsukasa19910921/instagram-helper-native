// i18n設定ファイル - React Native向け多言語対応
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 翻訳データのインポート
import ja from './locales/ja.json';
import en from './locales/en.json';

// UIロケール用のストレージキー（既存のユーザー設定とは独立）
const STORAGE_KEY = '@app/uiLocale';

/**
 * デバイス言語を検出する
 * 優先順位:
 * 1. AsyncStorageに保存された言語設定
 * 2. デバイスのロケール設定（expo-localization）
 * 3. デフォルト値（'ja'）
 */
async function detectLanguage() {
  try {
    // 1. 保存された言語設定を確認
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved && (saved === 'ja' || saved === 'en')) {
      console.log(`💾 保存された言語設定を読み込み: ${saved}`);
      return saved;
    }

    // 2. デバイスのロケールから言語コードを抽出（'ja-JP' -> 'ja'）
    const deviceLocale = Localization.locale || 'ja';
    const languageCode = deviceLocale.split('-')[0].toLowerCase();

    console.log(`🌍 デバイスロケールから言語を検出: ${deviceLocale} -> ${languageCode}`);

    // 対応言語の場合はそれを使用、非対応の場合は日本語をデフォルトに
    if (languageCode === 'ja' || languageCode === 'en') {
      return languageCode;
    }

    // 3. デフォルトは日本語
    console.log('🇯🇵 デフォルト言語（日本語）を使用');
    return 'ja';
  } catch (error) {
    console.error('❌ 言語検出エラー:', error);
    return 'ja'; // エラー時は日本語をデフォルト
  }
}

/**
 * i18nextを初期化する
 * アプリ起動時に一度だけ呼び出す
 * @returns {Promise<i18n>} 初期化されたi18nインスタンス
 */
export async function setupI18n() {
  try {
    // 言語を検出
    const lng = await detectLanguage();

    // i18nextを初期化
    await i18n
      .use(initReactI18next) // react-i18nextとの連携
      .init({
        lng, // 初期言語
        fallbackLng: 'ja', // フォールバック言語
        compatibilityJSON: 'v3', // React Native互換モード
        resources: {
          ja: { translation: ja },
          en: { translation: en }
        },
        interpolation: {
          escapeValue: false // Reactは自動でエスケープするため不要
        },
        returnNull: false, // nullではなく空文字列を返す
        react: {
          useSuspense: false // React Nativeではサスペンスを無効化
        }
      });

    console.log(`✅ i18n初期化完了 - 言語: ${lng}`);
    return i18n;
  } catch (error) {
    console.error('❌ i18n初期化エラー:', error);
    throw error;
  }
}

/**
 * UIロケールを変更する
 * AsyncStorageに保存し、アプリ再起動時も設定を維持
 * @param {string} nextLanguage - 新しい言語コード ('ja' または 'en')
 */
export async function changeLanguage(nextLanguage) {
  try {
    if (nextLanguage !== 'ja' && nextLanguage !== 'en') {
      console.warn(`⚠️ 非対応の言語コード: ${nextLanguage}`);
      return;
    }

    // i18nextの言語を変更
    await i18n.changeLanguage(nextLanguage);

    // AsyncStorageに保存
    await AsyncStorage.setItem(STORAGE_KEY, nextLanguage);

    console.log(`🔄 言語変更完了: ${nextLanguage}`);
  } catch (error) {
    console.error('❌ 言語変更エラー:', error);
    throw error;
  }
}

/**
 * 現在の言語コードを取得
 * @returns {string} 現在の言語コード ('ja' または 'en')
 */
export function getCurrentLanguage() {
  return i18n.language || 'ja';
}

// デフォルトエクスポート
export default i18n;
