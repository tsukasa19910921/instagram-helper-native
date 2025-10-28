// API通信サービス
import axios from 'axios';
import * as FileSystem from 'expo-file-system/legacy';
import { API_BASE_URL } from '../constants';

// axios設定（JSON形式で送信）
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60秒に設定（AI処理に時間がかかるため）
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * 画像処理API呼び出し
 * @param {Object} params - リクエストパラメータ
 * @param {string} params.image - Base64エンコードされた画像データ
 * @param {string} params.requiredKeyword - 必須キーワード（オプション）
 * @param {string} params.tone - 文章のトーン
 * @param {string} params.style - 文章のスタイル
 * @param {string} params.hashtagAmount - ハッシュタグの量
 * @param {string} params.language - 言語設定
 * @param {string} params.imageStyle - 画像スタイル
 * @returns {Promise<Object>} 処理結果
 */
export const processImage = async (params) => {
  try {
    // リクエストペイロードの作成
    // WEBアプリAPIがJSON形式に対応していることを前提とします
    const payload = {
      imageBase64: params.image, // 素のbase64文字列（data:プレフィックスなし）
      requiredKeyword: params.requiredKeyword || '',
      textStyle: params.tone,
      characterStyle: params.style,
      hashtagAmount: params.hashtagAmount,
      language: params.language,
      imageStyle: params.imageStyle
    };

    console.log('APIリクエスト送信:', {
      endpoint: '/process',
      imageBase64Length: payload.imageBase64.length,
      textStyle: payload.textStyle,
      language: payload.language
    });

    // API呼び出し（application/json）
    const response = await api.post('/process', payload);

    console.log('API応答受信:', {
      success: response.data.success,
      hasProcessedImage: !!response.data.processedImage,
      hasGeneratedText: !!response.data.generatedText
    });

    // レスポンスの処理
    // WEBアプリAPIのレスポンス形式：
    // {
    //   success: true,
    //   processedImage: "data:image/jpeg;base64,...",
    //   generatedText: "投稿文章",
    //   hashtags: "#ハッシュタグ"
    // }
    if (response.data.success && response.data.processedImage) {
      // 処理済み画像を一時ファイルとして保存（シェア用）
      const fileUri = FileSystem.documentDirectory + `processed_${Date.now()}.jpg`;

      // data:image/jpeg;base64, プレフィックスを除去してBase64部分のみを取得
      const base64Data = response.data.processedImage.replace(/^data:image\/\w+;base64,/, '');

      await FileSystem.writeAsStringAsync(
        fileUri,
        base64Data,
        { encoding: 'base64' }
      );

      // キャプションを生成（文章とハッシュタグを結合）
      const caption = `${response.data.generatedText}\n\n${response.data.hashtags}`;

      return {
        processedImage: fileUri,
        caption: caption,
        generatedText: response.data.generatedText,
        hashtags: response.data.hashtags
      };
    }

    throw new Error('Invalid response from API');
  } catch (error) {
    console.error('API Error:', error);

    // エラーメッセージを適切に処理
    if (error.response) {
      // サーバーからエラーレスポンスが返された場合
      const errorMessage = error.response.data?.error || 'サーバーエラーが発生しました';
      throw new Error(errorMessage);
    } else if (error.request) {
      // リクエストが送信されたがレスポンスがない場合
      throw new Error('ネットワークエラーが発生しました。インターネット接続を確認してください。');
    } else {
      // その他のエラー
      throw new Error(error.message || '処理中にエラーが発生しました');
    }
  }
};

// エラーハンドリング用インターセプター
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // HTTPステータスコードに応じたエラーメッセージ
      switch (error.response.status) {
        case 413:
          throw new Error('ファイルサイズが大きすぎます。4MB以下の画像を選択してください。');
        case 429:
          throw new Error('リクエストが多すぎます。しばらくお待ちください。');
        case 500:
          throw new Error('サーバーエラーが発生しました。');
        case 504:
          throw new Error('処理がタイムアウトしました。もう一度お試しください。');
        default:
          throw new Error(error.response.data?.error || '処理中にエラーが発生しました。');
      }
    } else if (error.request) {
      throw new Error('ネットワークエラーが発生しました。');
    }
    throw error;
  }
);
