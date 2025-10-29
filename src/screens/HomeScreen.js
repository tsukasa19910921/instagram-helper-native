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

// サービスとユーティリティのインポート
import { processImage } from '../services/api';
import { preprocessImage } from '../utils/imageUtils';
import { saveToHistory, getSettings } from '../services/storage';
import { TEXT_TONES, TEXT_STYLES, HASHTAG_AMOUNTS, LANGUAGES, IMAGE_STYLES } from '../constants';

// カスタムコンポーネント
import { CustomPicker } from '../components/CustomPicker';
import { InstagramHeader } from '../components/InstagramHeader';
import { InstagramButton } from '../components/InstagramButton';
import { InstagramCard } from '../components/InstagramCard';
import { useThemeColors } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';

const HomeScreen = () => {
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
  const [hashtagAmount, setHashtagAmount] = useState('normal');
  const [language, setLanguage] = useState('japanese');
  const [imageStyle, setImageStyle] = useState('original');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // 初期設定の読み込み
  useEffect(() => {
    loadInitialSettings();
  }, []);

  /**
   * 初期設定を読み込む
   */
  const loadInitialSettings = async () => {
    try {
      const settings = await getSettings();
      setSelectedTone(settings.defaultTone || 'serious');
      setSelectedStyle(settings.defaultStyle || 'neutral');
      setHashtagAmount(settings.defaultHashtagAmount || 'normal');
      setLanguage(settings.defaultLanguage || 'japanese');
      setImageStyle(settings.defaultImageStyle || 'original');
    } catch (error) {
      console.error('設定の読み込みに失敗:', error);
    }
  };

  /**
   * 画像選択ダイアログを表示
   */
  const selectImage = () => {
    Alert.alert(
      '写真を選択',
      '選択方法を選んでください',
      [
        { text: 'カメラで撮影', onPress: openCamera },
        { text: 'ギャラリーから選択', onPress: openGallery },
        { text: 'キャンセル', style: 'cancel' }
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
        Alert.alert('エラー', 'カメラへのアクセス許可が必要です');
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
      Alert.alert('エラー', 'カメラの起動に失敗しました');
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
        Alert.alert('エラー', '写真へのアクセス許可が必要です');
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
      Alert.alert('エラー', '写真の選択に失敗しました');
    }
  };

  /**
   * 画像を処理してキャプションを生成
   */
  const handleProcess = async () => {
    if (!selectedImage) {
      Alert.alert('エラー', '写真を選択してください');
      return;
    }

    setLoading(true);
    setLoadingMessage('画像を処理中...');

    try {
      // 画像の前処理（正方形にトリミング + 圧縮）
      // ⚠️ この低画質版はGemini APIへの送信のみに使用（表示・保存には使わない）
      setLoadingMessage('画像を最適化中...');
      const processedImageData = await preprocessImage(selectedImage.uri, 1080, 0.8);

      // APIに送信（テキスト生成のみ、画像は返ってこない）
      setLoadingMessage('AIが文章を生成中...\nしばらくお待ちください');
      const result = await processImage({
        image: processedImageData.base64,
        requiredKeyword,
        tone: selectedTone,
        style: selectedStyle,
        hashtagAmount,
        language,
        imageStyle
      });

      // 結果を設定
      setGeneratedCaption(result.caption);
      setGeneratedText(result.generatedText);
      setGeneratedHashtags(result.hashtags);

      // 履歴に保存（元の高解像度画像のURIを保存）
      await saveToHistory({
        originalImageUri: selectedImage.uri, // 元の高解像度画像
        caption: result.caption,
        generatedText: result.generatedText,
        hashtags: result.hashtags,
        settings: {
          tone: selectedTone,
          style: selectedStyle,
          hashtagAmount,
          language,
          imageStyle,
          requiredKeyword
        }
      });

      // 成功フィードバック
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('完了', '投稿文の生成が完了しました！');

    } catch (error) {
      console.error('処理エラー:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('エラー', error.message || '処理中にエラーが発生しました');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  /**
   * キャプションをクリップボードにコピー
   */
  const copyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(generatedCaption);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('コピー完了', '文章をクリップボードにコピーしました');
    } catch (error) {
      console.error('コピーエラー:', error);
      Alert.alert('エラー', 'コピーに失敗しました');
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
          'シェア準備完了',
          '投稿文をクリップボードにコピーしました',
          [
            {
              text: 'OK',
              onPress: async () => {
                try {
                  // OKを押したらシェアウィンドウを開く
                  await Sharing.shareAsync(selectedImage.uri, {
                    mimeType: 'image/jpeg',
                    dialogTitle: 'Instagram投稿をシェア'
                  });
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch (shareError) {
                  console.error('シェアエラー:', shareError);
                  Alert.alert('エラー', 'シェアに失敗しました');
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('エラー', 'シェア機能が利用できません');
      }
    } catch (error) {
      console.error('コピーエラー:', error);
      Alert.alert('エラー', 'コピーに失敗しました');
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
                <Text style={styles.placeholderIcon}>📷</Text>
                <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>タップして写真を選択</Text>
              </View>
            )}
          </TouchableOpacity>
        </InstagramCard>

        {/* 設定フォーム */}
        <InstagramCard>
          <View style={styles.form}>
        {/* 必須キーワード */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>必須キーワード（オプション）</Text>
          <TextInput
            style={styles.textInput}
            placeholder="例: 東京"
            value={requiredKeyword}
            onChangeText={setRequiredKeyword}
            maxLength={20}
            editable={!loading}
          />
        </View>

        {/* 文章のトーン */}
        <View style={styles.inputGroup}>
          <CustomPicker
            label="文章のトーン"
            selectedValue={selectedTone}
            onValueChange={setSelectedTone}
            options={TEXT_TONES}
            disabled={loading}
          />
        </View>

        {/* 文章のスタイル */}
        <View style={styles.inputGroup}>
          <CustomPicker
            label="文章のスタイル"
            selectedValue={selectedStyle}
            onValueChange={setSelectedStyle}
            options={TEXT_STYLES}
            disabled={loading}
          />
        </View>

        {/* ハッシュタグの量 */}
        <View style={styles.inputGroup}>
          <CustomPicker
            label="ハッシュタグの量"
            selectedValue={hashtagAmount}
            onValueChange={setHashtagAmount}
            options={HASHTAG_AMOUNTS}
            disabled={loading}
          />
        </View>

            {/* 言語設定 */}
            <View style={styles.inputGroup}>
              <CustomPicker
                label="言語"
                selectedValue={language}
                onValueChange={setLanguage}
                options={LANGUAGES}
                disabled={loading}
              />
            </View>
          </View>
        </InstagramCard>

        {/* 生成ボタン */}
        <View style={styles.buttonContainer}>
          <InstagramButton
            title={loading ? '処理中...' : '投稿を生成'}
            icon={<Ionicons name="sparkles" size={20} color="#fff" />}
            onPress={handleProcess}
            disabled={loading || !selectedImage}
            accessibilityLabel="投稿を生成"
            accessibilityHint="選択した画像からInstagram投稿文を生成します"
          />
        </View>

        {/* 結果表示エリア（投稿文とハッシュタグのみ表示） */}
        {generatedCaption && (
          <InstagramCard>
            <Text style={[styles.resultTitle, { color: colors.textPrimary }]}>生成結果</Text>

            {/* 生成されたキャプション */}
            <View style={styles.captionContainer}>
              <Text style={[styles.captionText, { color: colors.textPrimary }]}>{generatedCaption}</Text>

              {/* アクションボタン */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, { borderColor: colors.border }]}
                  onPress={copyToClipboard}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.actionButtonText, { color: colors.primary }]}>生成結果をコピー</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { borderColor: colors.border }]}
                  onPress={shareContent}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.actionButtonText, { color: colors.primary }]}>生成結果でシェア</Text>
                </TouchableOpacity>
              </View>
            </View>
          </InstagramCard>
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
    fontSize: 60,
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
    paddingVertical: 12,
    marginHorizontal: 4,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center'
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  },
  bottomSpacer: {
    height: 40
  }
});

export default HomeScreen;
