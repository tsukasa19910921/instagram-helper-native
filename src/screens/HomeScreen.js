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
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';

// サービスとユーティリティのインポート
import { processImage } from '../services/api';
import { preprocessImage } from '../utils/imageUtils';
import { saveToHistory, getSettings } from '../services/storage';
import { TEXT_TONES, TEXT_STYLES, HASHTAG_AMOUNTS, LANGUAGES, IMAGE_STYLES } from '../constants';

const HomeScreen = () => {
  // 状態管理
  const [selectedImage, setSelectedImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [generatedCaption, setGeneratedCaption] = useState('');
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
        setProcessedImage(null);
        setGeneratedCaption('');
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
        setProcessedImage(null);
        setGeneratedCaption('');
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
      setLoadingMessage('画像を最適化中...');
      const processedImageData = await preprocessImage(selectedImage.uri, 1080, 0.8);

      // APIに送信
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
      setProcessedImage(result.processedImage);
      setGeneratedCaption(result.caption);

      // 履歴に保存
      await saveToHistory({
        processedImage: result.processedImage,
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
      Alert.alert('完了', '画像の処理が完了しました！');

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
   */
  const shareContent = async () => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable && processedImage) {
        await Sharing.shareAsync(processedImage, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Instagram投稿をシェア'
        });
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Alert.alert('エラー', 'シェア機能が利用できません');
      }
    } catch (error) {
      console.error('シェアエラー:', error);
      Alert.alert('エラー', 'シェアに失敗しました');
    }
  };

  /**
   * 画像を端末に保存
   */
  const saveToGallery = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('エラー', '写真の保存には権限が必要です');
        return;
      }

      if (processedImage) {
        await MediaLibrary.createAssetAsync(processedImage);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('保存完了', '画像をカメラロールに保存しました');
      }
    } catch (error) {
      console.error('保存エラー:', error);
      Alert.alert('エラー', '画像の保存に失敗しました');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* ローディングオーバーレイ */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{loadingMessage}</Text>
        </View>
      )}

      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>Instagram投稿生成</Text>
        <Text style={styles.subtitle}>AIが写真を解析して投稿文を作成</Text>
      </View>

      {/* 画像選択エリア */}
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
            <Text style={styles.placeholderText}>タップして写真を選択</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* 設定フォーム */}
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
          <Text style={styles.label}>文章のトーン</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedTone}
              onValueChange={setSelectedTone}
              style={styles.picker}
              enabled={!loading}
            >
              {TEXT_TONES.map(tone => (
                <Picker.Item key={tone.value} label={tone.label} value={tone.value} />
              ))}
            </Picker>
          </View>
        </View>

        {/* 文章のスタイル */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>文章のスタイル</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedStyle}
              onValueChange={setSelectedStyle}
              style={styles.picker}
              enabled={!loading}
            >
              {TEXT_STYLES.map(style => (
                <Picker.Item key={style.value} label={style.label} value={style.value} />
              ))}
            </Picker>
          </View>
        </View>

        {/* ハッシュタグの量 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>ハッシュタグの量</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={hashtagAmount}
              onValueChange={setHashtagAmount}
              style={styles.picker}
              enabled={!loading}
            >
              {HASHTAG_AMOUNTS.map(amount => (
                <Picker.Item key={amount.value} label={amount.label} value={amount.value} />
              ))}
            </Picker>
          </View>
        </View>

        {/* 言語設定 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>言語</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={language}
              onValueChange={setLanguage}
              style={styles.picker}
              enabled={!loading}
            >
              {LANGUAGES.map(lang => (
                <Picker.Item key={lang.value} label={lang.label} value={lang.value} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      {/* 生成ボタン */}
      <TouchableOpacity
        style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]}
        onPress={handleProcess}
        disabled={loading || !selectedImage}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>
          {loading ? '処理中...' : '投稿を生成'}
        </Text>
      </TouchableOpacity>

      {/* 結果表示エリア */}
      {processedImage && generatedCaption && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>生成結果</Text>

          {/* 処理済み画像 */}
          <Image source={{ uri: processedImage }} style={styles.resultImage} />

          {/* 生成されたキャプション */}
          <View style={styles.captionContainer}>
            <Text style={styles.captionLabel}>投稿文</Text>
            <Text style={styles.captionText}>{generatedCaption}</Text>

            {/* アクションボタン */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={copyToClipboard}
                activeOpacity={0.7}
              >
                <Text style={styles.actionButtonText}>コピー</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={saveToGallery}
                activeOpacity={0.7}
              >
                <Text style={styles.actionButtonText}>保存</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={shareContent}
                activeOpacity={0.7}
              >
                <Text style={styles.actionButtonText}>シェア</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  header: {
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: '#8e8e93'
  },
  imageSelector: {
    margin: 20,
    height: 300,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5
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
  button: {
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  primaryButton: {
    backgroundColor: '#007AFF'
  },
  buttonDisabled: {
    backgroundColor: '#c7c7cc'
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  resultContainer: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5
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
