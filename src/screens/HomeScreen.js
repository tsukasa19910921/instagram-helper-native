// ホーム画面 - Instagram投稿生成のメイン機能
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

// サービスとユーティリティのインポート
import { processImage } from '../services/api';
import { preprocessImage, isImageSizeValid } from '../utils/imageUtils';
import { saveSettings, getSettings } from '../services/storage';
import { TEXT_TONES, TEXT_STYLES, LANGUAGES, IMAGE_STYLES, HASHTAG_COUNT_DEFAULT, HASHTAG_COUNT_MIN, HASHTAG_COUNT_MAX } from '../constants';

// 広告マネージャーのインポート
// 本番ビルド用: 広告機能を有効化
import { showInterstitialAd, preloadAd } from '../services/adManager';

// カスタムコンポーネント
import { CustomPicker } from '../components/CustomPicker';
import { InstagramHeader } from '../components/InstagramHeader';
import { InstagramButton } from '../components/InstagramButton';
import { InstagramCard } from '../components/InstagramCard';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useThemeColors } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';

const HomeScreen = () => {
  // 多言語対応
  const { t } = useTranslation();

  // テーマカラーの取得
  const colors = useThemeColors();

  // 状態管理
  const [selectedImage, setSelectedImage] = useState(null); // 元の高解像度画像（表示・シェア・保存に使用）
  const [generatedCaption, setGeneratedCaption] = useState('');
  const [generatedText, setGeneratedText] = useState(''); // 投稿文のみ
  const [generatedHashtags, setGeneratedHashtags] = useState(''); // ハッシュタグのみ
  const [requiredKeyword, setRequiredKeyword] = useState('');
  const [selectedTone, setSelectedTone] = useState('serious');
  const [selectedStyle, setSelectedStyle] = useState('neutral');
  const [hashtagCount, setHashtagCount] = useState(HASHTAG_COUNT_DEFAULT); // 数値型に変更
  const [language, setLanguage] = useState('japanese');
  const [imageStyle, setImageStyle] = useState('original');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // 初期設定の読み込み
  useEffect(() => {
    loadInitialSettings();
    // 広告を事前にロード
    preloadAd();
  }, []);

  /**
   * 初期設定を読み込む
   */
  const loadInitialSettings = async () => {
    try {
      const settings = await getSettings();
      setSelectedTone(settings.defaultTone || 'serious');
      setSelectedStyle(settings.defaultStyle || 'neutral');
      setHashtagCount(settings.defaultHashtagCount || HASHTAG_COUNT_DEFAULT); // 数値型に変更
      setLanguage(settings.defaultLanguage || 'japanese');
      setImageStyle(settings.defaultImageStyle || 'original');
    } catch (error) {
      console.error('設定の読み込みに失敗:', error);
    }
  };

  /**
   * 設定を保存する（Picker変更時に即座に保存）
   */
  const updateAndSaveSettings = async (key, value) => {
    try {
      const currentSettings = await getSettings();
      const newSettings = {
        ...currentSettings,
        [key]: value
      };
      await saveSettings(newSettings);
      console.log(`設定を保存しました: ${key} = ${value}`);
    } catch (error) {
      console.error('設定の保存に失敗:', error);
    }
  };

  /**
   * 画像選択ダイアログを表示
   */
  const selectImage = () => {
    Alert.alert(
      t('imagePicker.selectPhoto'),
      t('imagePicker.selectMethod'),
      [
        { text: t('imagePicker.takePhoto'), onPress: openCamera },
        { text: t('imagePicker.chooseFromGallery'), onPress: openGallery },
        { text: t('imagePicker.cancel'), style: 'cancel' }
      ]
    );
  };

  /**
   * カメラを開いて写真を撮影
   */
  const openCamera = async () => {
    try {
      // カメラ権限の確認
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('alerts.error'), t('alerts.cameraPermission'));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8
      });

      if (!result.canceled) {
        // 触覚フィードバック
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        setSelectedImage({
          uri: result.assets[0].uri
        });

        // 結果をクリア
        setGeneratedCaption('');
        setGeneratedText('');
        setGeneratedHashtags('');
      }
    } catch (error) {
      console.error('カメラエラー:', error);
      Alert.alert(t('alerts.error'), t('alerts.cameraError'));
    }
  };

  /**
   * ギャラリーから写真を選択
   */
  const openGallery = async () => {
    try {
      // ギャラリー権限の確認
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('alerts.error'), t('alerts.galleryPermission'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8
      });

      if (!result.canceled) {
        // 触覚フィードバック
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        setSelectedImage({
          uri: result.assets[0].uri
        });

        // 結果をクリア
        setGeneratedCaption('');
        setGeneratedText('');
        setGeneratedHashtags('');
      }
    } catch (error) {
      console.error('ギャラリーエラー:', error);
      Alert.alert(t('alerts.error'), t('alerts.galleryError'));
    }
  };

  /**
   * 画像を処理してキャプションを生成
   * 改良版: AI処理 → 広告表示 → 結果表示
   */
  const handleProcess = async () => {
    if (!selectedImage) {
      Alert.alert(t('alerts.error'), t('alerts.selectImage'));
      return;
    }

    setLoading(true);
    // ⭐ ローディングメッセージで広告表示を予告
    setLoadingMessage(t('loading.generatingWithAd'));

    try {
      // ⭐ ステップ1: 画像の前処理（正方形にトリミング + 圧縮）
      // ⚠️ この低画質版はGemini APIへの送信のみに使用（表示・保存には使わない）
      const processedImageData = await preprocessImage(selectedImage.uri, 1080, 0.8);

      // 画像サイズの検証（4MB制限）
      if (!isImageSizeValid(processedImageData.base64, 4)) {
        throw new Error(t('alerts.imageSizeError'));
      }

      // ⭐ ステップ2: APIに送信（テキスト生成のみ、画像は返ってこない）
      const result = await processImage({
        image: processedImageData.base64,
        requiredKeyword,
        tone: selectedTone,
        style: selectedStyle,
        hashtagCount, // 数値型に変更
        language,
        imageStyle
      });

      // ⭐ ステップ3: AI処理が完了したら、ローディングを一旦終了
      setLoading(false);
      setLoadingMessage('');

      // ⭐ ステップ4: 広告を表示
      try {
        await showInterstitialAd();
        console.log('広告の表示が完了しました');
      } catch (adError) {
        // 広告表示に失敗しても処理は続行
        console.warn('広告表示エラー（処理は続行）:', adError);
      }

      // ⭐ ステップ5: 結果を設定
      setGeneratedCaption(result.caption);
      setGeneratedText(result.generatedText);
      setGeneratedHashtags(result.hashtags);

      // ⭐ ステップ6: 成功フィードバック
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t('alerts.success'), t('alerts.generated'));

    } catch (error) {
      console.error('処理エラー:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('alerts.error'), error.message || t('alerts.processingError'));
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  /**
   * 初期状態にリセット（別の画像でやりなおす）
   */
  const resetToInitialState = () => {
    setSelectedImage(null);
    setGeneratedCaption('');
    setGeneratedText('');
    setGeneratedHashtags('');
    // 設定はそのまま保持
  };

  /**
   * キャプションをクリップボードにコピー
   */
  const copyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(generatedCaption);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t('alerts.success'), t('alerts.copied'));
    } catch (error) {
      console.error('コピーエラー:', error);
      Alert.alert(t('alerts.error'), t('alerts.copyError'));
    }
  };

  /**
   * 画像とキャプションをシェア
   * ⚠️ 元の高解像度画像を使用（低画質版は使わない）
   * ✨ シェア時に投稿文を自動でクリップボードにコピー
   * 📱 アラート表示 → OKボタン → シェアウィンドウの順序
   */
  const shareContent = async () => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable && selectedImage?.uri) {
        // 投稿文を自動でコピー（Instagramに貼り付けるため）
        await Clipboard.setStringAsync(generatedCaption);

        // アラートを表示して、OKを押したらシェアウィンドウを開く
        Alert.alert(
          t('alerts.shareReady'),
          t('alerts.shareMessage'),
          [
            {
              text: t('alerts.ok'),
              onPress: async () => {
                try {
                  // OKを押したらシェアウィンドウを開く
                  await Sharing.shareAsync(selectedImage.uri, {
                    mimeType: 'image/jpeg',
                    dialogTitle: t('header.title')
                  });
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch (shareError) {
                  console.error('シェアエラー:', shareError);
                  Alert.alert(t('alerts.error'), t('alerts.shareError'));
                }
              }
            }
          ]
        );
      } else {
        Alert.alert(t('alerts.error'), t('alerts.shareUnavailable'));
      }
    } catch (error) {
      console.error('コピーエラー:', error);
      Alert.alert(t('alerts.error'), t('alerts.copyError'));
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
      {/* ローディングオーバーレイ */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{loadingMessage}</Text>
        </View>
      )}

      {/* Instagram風ヘッダー（スクロール可能） */}
      <InstagramHeader />

      {/* 言語切り替えコンポーネント */}
      <LanguageSwitcher />

        {/* 画像選択エリア */}
        <InstagramCard>
          <TouchableOpacity
            style={styles.imageSelector}
            onPress={selectImage}
            activeOpacity={0.7}
          >
            {selectedImage ? (
              <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
            ) : (
              <View style={styles.placeholderContainer}>
                <Ionicons name="camera" size={60} color={colors.textSecondary} style={styles.placeholderIcon} />
                <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>{t('imagePicker.placeholder')}</Text>
              </View>
            )}
          </TouchableOpacity>
        </InstagramCard>

        {/* 設定フォーム */}
        <InstagramCard>
          <View style={styles.form}>
        {/* 必須キーワード */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('form.requiredKeyword')}</Text>
          <TextInput
            style={styles.textInput}
            placeholder={t('form.requiredKeywordPlaceholder')}
            value={requiredKeyword}
            onChangeText={setRequiredKeyword}
            maxLength={20}
            editable={!loading}
          />
        </View>

        {/* 文章のトーン */}
        <View style={styles.inputGroup}>
          <CustomPicker
            label={t('form.tone')}
            selectedValue={selectedTone}
            onValueChange={(value) => {
              setSelectedTone(value);
              updateAndSaveSettings('defaultTone', value);
            }}
            options={TEXT_TONES}
            disabled={loading}
          />
        </View>

        {/* 文章のスタイル */}
        <View style={styles.inputGroup}>
          <CustomPicker
            label={t('form.style')}
            selectedValue={selectedStyle}
            onValueChange={(value) => {
              setSelectedStyle(value);
              updateAndSaveSettings('defaultStyle', value);
            }}
            options={TEXT_STYLES}
            disabled={loading}
          />
        </View>

        {/* ハッシュタグの数 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('form.hashtagCount')}</Text>
          <TextInput
            style={styles.textInput}
            placeholder={t('form.hashtagCountPlaceholder')}
            value={String(hashtagCount)}
            onChangeText={(text) => {
              // 数値のみ入力可能
              const numValue = parseInt(text) || 0;
              // 範囲チェック（1〜30）
              if (numValue >= HASHTAG_COUNT_MIN && numValue <= HASHTAG_COUNT_MAX) {
                setHashtagCount(numValue);
                updateAndSaveSettings('defaultHashtagCount', numValue);
              } else if (text === '' || numValue === 0) {
                // 空欄の場合はデフォルト値に戻す
                setHashtagCount(HASHTAG_COUNT_DEFAULT);
                updateAndSaveSettings('defaultHashtagCount', HASHTAG_COUNT_DEFAULT);
              }
            }}
            keyboardType="number-pad"
            maxLength={2}
            editable={!loading}
          />
          <Text style={styles.helperText}>
            {t('form.hashtagCountHelper', { min: HASHTAG_COUNT_MIN, max: HASHTAG_COUNT_MAX })}
          </Text>
        </View>

            {/* 言語設定（API生成言語用 - UIロケールとは独立） */}
            <View style={styles.inputGroup}>
              <CustomPicker
                label={t('form.language')}
                selectedValue={language}
                onValueChange={(value) => {
                  setLanguage(value);
                  updateAndSaveSettings('defaultLanguage', value);
                }}
                options={LANGUAGES}
                disabled={loading}
              />
            </View>
          </View>
        </InstagramCard>

        {/* 生成ボタン */}
        <View style={styles.buttonContainer}>
          <InstagramButton
            title={loading ? t('buttons.generating') : t('buttons.generate')}
            icon={<Ionicons name="sparkles" size={20} color="#fff" />}
            onPress={handleProcess}
            disabled={loading || !selectedImage}
            accessibilityLabel={t('accessibility.generate')}
            accessibilityHint={t('accessibility.generateHint')}
          />
        </View>

        {/* 結果表示エリア（投稿文とハッシュタグのみ表示） */}
        {generatedCaption && (
          <>
            <InstagramCard>
              <Text style={[styles.resultTitle, { color: colors.textPrimary }]}>{t('results.title')}</Text>

              {/* 生成されたキャプション */}
              <View style={styles.captionContainer}>
                <Text style={[styles.captionText, { color: colors.textPrimary }]}>{generatedCaption}</Text>

                {/* アクションボタン */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={copyToClipboard}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionButtonText}>{t('buttons.copy')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={shareContent}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionButtonText}>{t('buttons.share')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </InstagramCard>

            {/* 別の画像でやりなおすボタン */}
            <View style={styles.buttonContainer}>
              <InstagramButton
                title={t('buttons.retry')}
                icon={<Ionicons name="refresh" size={20} color="#fff" />}
                onPress={resetToInitialState}
                disabled={loading}
                accessibilityLabel={t('accessibility.retry')}
                accessibilityHint={t('accessibility.retryHint')}
              />
            </View>
          </>
        )}

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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  loadingText: {
    color: '#FFF',
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20
  },
  imageSelector: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden'
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9'
  },
  placeholderIcon: {
    marginBottom: 12
  },
  placeholderText: {
    fontSize: 16,
    color: '#8e8e93'
  },
  form: {
    paddingHorizontal: 20
  },
  inputGroup: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 8
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#d1d1d6'
  },
  helperText: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 4
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d1d6',
    overflow: 'hidden'
  },
  picker: {
    height: 50
  },
  buttonContainer: {
    marginHorizontal: 20,
    marginVertical: 10
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 16
  },
  resultImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 16
  },
  captionContainer: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8
  },
  captionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8e8e93',
    marginBottom: 8
  },
  captionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1c1c1e',
    marginBottom: 16
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    marginHorizontal: 4,
    backgroundColor: '#E1306C', // Instagram ピンク
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#E1306C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15
  },
  bottomSpacer: {
    height: 40
  }
});

export default HomeScreen;
