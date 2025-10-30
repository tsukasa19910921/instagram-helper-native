/**
 * 言語切り替えコンポーネント
 * UIロケール（ja/en）を切り替えるための専用コンポーネント
 *
 * 注意:
 * - これはUIロケール（画面表示言語）の切り替え専用です
 * - API生成言語（japanese/english/bilingual）とは独立しています
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { changeLanguage } from '../i18n';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language || 'ja';

  /**
   * 言語を切り替える
   * @param {string} lang - 新しい言語コード ('ja' または 'en')
   */
  const handleLanguageChange = async (lang) => {
    if (lang === currentLanguage) return; // 同じ言語の場合は何もしない

    try {
      // 触覚フィードバック
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // 言語を変更（i18next + AsyncStorage）
      await changeLanguage(lang);

      console.log(`🌍 言語を変更しました: ${currentLanguage} -> ${lang}`);
    } catch (error) {
      console.error('❌ 言語切り替えエラー:', error);
    }
  };

  /**
   * 言語ボタンのスタイルを取得
   * @param {string} lang - 言語コード
   * @returns {object} スタイルオブジェクト
   */
  const getButtonStyle = (lang) => {
    return lang === currentLanguage
      ? [styles.button, styles.buttonActive]
      : styles.button;
  };

  /**
   * 言語ボタンのテキストスタイルを取得
   * @param {string} lang - 言語コード
   * @returns {object} スタイルオブジェクト
   */
  const getTextStyle = (lang) => {
    return lang === currentLanguage
      ? [styles.buttonText, styles.buttonTextActive]
      : styles.buttonText;
  };

  return (
    <View style={styles.container}>
      {/* 日本語ボタン */}
      <TouchableOpacity
        style={getButtonStyle('ja')}
        onPress={() => handleLanguageChange('ja')}
        activeOpacity={0.7}
        accessibilityLabel="日本語に切り替え"
        accessibilityRole="button"
      >
        <Text style={getTextStyle('ja')}>🇯🇵 日本語</Text>
      </TouchableOpacity>

      {/* 英語ボタン */}
      <TouchableOpacity
        style={getButtonStyle('en')}
        onPress={() => handleLanguageChange('en')}
        activeOpacity={0.7}
        accessibilityLabel="Switch to English"
        accessibilityRole="button"
      >
        <Text style={getTextStyle('en')}>🇺🇸 English</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 20,
    marginVertical: 10
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f5f5f7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonActive: {
    backgroundColor: '#E1306C', // Instagram ピンク
    shadowColor: '#E1306C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8e8e93'
  },
  buttonTextActive: {
    color: '#fff'
  }
});
