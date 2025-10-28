// 設定画面 - デフォルト設定の管理
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  TouchableOpacity
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { getSettings, saveSettings } from '../services/storage';
import { TEXT_TONES, TEXT_STYLES, HASHTAG_AMOUNTS, LANGUAGES, IMAGE_STYLES } from '../constants';

// カスタムコンポーネント
import { CustomPicker } from '../components/CustomPicker';

const SettingsScreen = () => {
  // 設定状態
  const [defaultTone, setDefaultTone] = useState('serious');
  const [defaultStyle, setDefaultStyle] = useState('neutral');
  const [defaultHashtagAmount, setDefaultHashtagAmount] = useState('normal');
  const [defaultLanguage, setDefaultLanguage] = useState('japanese');
  const [defaultImageStyle, setDefaultImageStyle] = useState('original');
  const [saveToGalleryByDefault, setSaveToGalleryByDefault] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 初期設定の読み込み
  useEffect(() => {
    loadSettings();
  }, []);

  /**
   * 設定を読み込む
   */
  const loadSettings = async () => {
    try {
      const settings = await getSettings();
      setDefaultTone(settings.defaultTone);
      setDefaultStyle(settings.defaultStyle);
      setDefaultHashtagAmount(settings.defaultHashtagAmount);
      setDefaultLanguage(settings.defaultLanguage);
      setDefaultImageStyle(settings.defaultImageStyle);
      setSaveToGalleryByDefault(settings.saveToGalleryByDefault);
      setHasChanges(false);
    } catch (error) {
      console.error('設定の読み込みエラー:', error);
      Alert.alert('エラー', '設定の読み込みに失敗しました');
    }
  };

  /**
   * 設定を保存する
   */
  const handleSaveSettings = async () => {
    try {
      const settings = {
        defaultTone,
        defaultStyle,
        defaultHashtagAmount,
        defaultLanguage,
        defaultImageStyle,
        saveToGalleryByDefault
      };

      await saveSettings(settings);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setHasChanges(false);
      Alert.alert('保存完了', '設定を保存しました');
    } catch (error) {
      console.error('設定の保存エラー:', error);
      Alert.alert('エラー', '設定の保存に失敗しました');
    }
  };

  /**
   * 設定をリセット
   */
  const handleResetSettings = () => {
    Alert.alert(
      '設定をリセット',
      'すべての設定をデフォルトに戻しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'リセット',
          style: 'destructive',
          onPress: () => {
            setDefaultTone('serious');
            setDefaultStyle('neutral');
            setDefaultHashtagAmount('normal');
            setDefaultLanguage('japanese');
            setDefaultImageStyle('original');
            setSaveToGalleryByDefault(false);
            setHasChanges(true);
          }
        }
      ]
    );
  };

  /**
   * 値変更時のハンドラー
   */
  const handleChange = (setter, value) => {
    setter(value);
    setHasChanges(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>デフォルト設定</Text>
        <Text style={styles.headerSubtitle}>
          ホーム画面で使用される初期設定を変更できます
        </Text>
      </View>

      {/* 設定セクション */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>投稿設定</Text>

        {/* 文章のトーン */}
        <View style={styles.settingItem}>
          <CustomPicker
            label="文章のトーン"
            selectedValue={defaultTone}
            onValueChange={(value) => handleChange(setDefaultTone, value)}
            options={TEXT_TONES}
          />
        </View>

        {/* 文章のスタイル */}
        <View style={styles.settingItem}>
          <CustomPicker
            label="文章のスタイル"
            selectedValue={defaultStyle}
            onValueChange={(value) => handleChange(setDefaultStyle, value)}
            options={TEXT_STYLES}
          />
        </View>

        {/* ハッシュタグの量 */}
        <View style={styles.settingItem}>
          <CustomPicker
            label="ハッシュタグの量"
            selectedValue={defaultHashtagAmount}
            onValueChange={(value) => handleChange(setDefaultHashtagAmount, value)}
            options={HASHTAG_AMOUNTS}
          />
        </View>

        {/* 言語設定 */}
        <View style={styles.settingItem}>
          <CustomPicker
            label="言語"
            selectedValue={defaultLanguage}
            onValueChange={(value) => handleChange(setDefaultLanguage, value)}
            options={LANGUAGES}
          />
        </View>
      </View>

      {/* その他の設定 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>その他</Text>

        {/* 自動保存 */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.label}>自動的にギャラリーに保存</Text>
            <Text style={styles.description}>
              処理完了後、画像を自動的にカメラロールに保存します
            </Text>
          </View>
          <Switch
            value={saveToGalleryByDefault}
            onValueChange={(value) => handleChange(setSaveToGalleryByDefault, value)}
            trackColor={{ false: '#d1d1d6', true: '#007AFF' }}
            thumbColor={saveToGalleryByDefault ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* アクションボタン */}
      <View style={styles.actions}>
        {hasChanges && (
          <View style={styles.changesIndicator}>
            <Text style={styles.changesText}>未保存の変更があります</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleSaveSettings}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>設定を保存</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleResetSettings}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            デフォルトに戻す
          </Text>
        </TouchableOpacity>
      </View>

      {/* アプリ情報 */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoTitle}>Instagram投稿ジェネレーター</Text>
        <Text style={styles.appInfoVersion}>バージョン 1.0.0</Text>
        <Text style={styles.appInfoCopyright}>
          AIが写真を解析して最適な投稿文を生成します
        </Text>
      </View>

      {/* 下部の余白 */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7'
  },
  contentContainer: {
    paddingBottom: 20
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 4
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8e8e93'
  },
  section: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e5ea'
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8e8e93',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f7'
  },
  settingItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea'
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea'
  },
  settingInfo: {
    flex: 1,
    marginRight: 12
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 8
  },
  description: {
    fontSize: 13,
    color: '#8e8e93',
    marginTop: 4
  },
  pickerContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d1d6',
    overflow: 'hidden'
  },
  picker: {
    height: 50
  },
  actions: {
    paddingHorizontal: 20,
    marginTop: 20
  },
  changesIndicator: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffc107'
  },
  changesText: {
    color: '#856404',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center'
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  primaryButton: {
    backgroundColor: '#007AFF'
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d1d6'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  secondaryButtonText: {
    color: '#007AFF'
  },
  appInfo: {
    marginTop: 30,
    paddingHorizontal: 20,
    alignItems: 'center'
  },
  appInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 4
  },
  appInfoVersion: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 8
  },
  appInfoCopyright: {
    fontSize: 12,
    color: '#8e8e93',
    textAlign: 'center'
  },
  bottomSpacer: {
    height: 40
  }
});

export default SettingsScreen;
