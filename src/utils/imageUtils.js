// 画像処理ユーティリティ
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'react-native';

/**
 * 画像を圧縮してリサイズする
 * @param {string} imageUri - 画像のURI
 * @param {number} maxWidth - 最大幅（デフォルト: 1080px）
 * @param {number} quality - 圧縮品質（0-1、デフォルト: 0.8）
 * @returns {Promise<Object>} 圧縮された画像オブジェクト（uri, base64を含む）
 */
export const compressImage = async (imageUri, maxWidth = 1080, quality = 0.8) => {
  try {
    console.log('画像を圧縮中...', { maxWidth, quality });

    const manipulatedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          resize: {
            width: maxWidth
          }
        }
      ],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true
      }
    );

    console.log('圧縮完了:', {
      uri: manipulatedImage.uri,
      base64Length: manipulatedImage.base64?.length || 0
    });

    return manipulatedImage;
  } catch (error) {
    console.error('Image compression error:', error);
    throw new Error('画像の圧縮に失敗しました: ' + error.message);
  }
};

/**
 * 画像をBase64文字列に変換する
 * @param {string} imageUri - 画像のURI
 * @returns {Promise<string>} Base64文字列（data:プレフィックスなし）
 */
export const imageToBase64 = async (imageUri) => {
  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64'
    });
    return base64;
  } catch (error) {
    console.error('Base64 conversion error:', error);
    throw new Error('Base64変換に失敗しました: ' + error.message);
  }
};

/**
 * 画像を正方形（1:1）にトリミングする
 * Instagram向けに最適化
 * @param {string} imageUri - 画像のURI
 * @returns {Promise<Object>} トリミングされた画像オブジェクト
 */
export const cropToSquare = async (imageUri) => {
  try {
    console.log('画像を正方形にトリミング中...');

    // 画像の寸法を取得（Image.getSizeを使用して高速化）
    const { width, height } = await new Promise((resolve, reject) => {
      Image.getSize(
        imageUri,
        (width, height) => resolve({ width, height }),
        (error) => reject(error)
      );
    });

    console.log('元の画像サイズ:', { width, height });

    // 正方形にクロップするための計算
    const size = Math.min(width, height);
    const xOffset = (width - size) / 2;
    const yOffset = (height - size) / 2;

    const croppedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          crop: {
            originX: xOffset,
            originY: yOffset,
            width: size,
            height: size
          }
        }
      ],
      {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true
      }
    );

    console.log('トリミング完了:', {
      uri: croppedImage.uri,
      size: `${size}x${size}`
    });

    return croppedImage;
  } catch (error) {
    console.error('Crop error:', error);
    throw new Error('画像のトリミングに失敗しました: ' + error.message);
  }
};

/**
 * 画像を前処理する（トリミング + 圧縮）
 * API送信前に実行することを推奨
 * @param {string} imageUri - 画像のURI
 * @param {number} maxWidth - 最大幅（デフォルト: 1080px）
 * @param {number} quality - 圧縮品質（0-1、デフォルト: 0.8）
 * @returns {Promise<Object>} 処理済み画像オブジェクト（uri, base64を含む）
 */
export const preprocessImage = async (imageUri, maxWidth = 1080, quality = 0.8) => {
  try {
    console.log('画像の前処理を開始...');

    // 1. 正方形にトリミング
    const croppedImage = await cropToSquare(imageUri);

    // 2. リサイズと圧縮
    const processedImage = await compressImage(croppedImage.uri, maxWidth, quality);

    console.log('前処理完了:', {
      base64Length: processedImage.base64?.length || 0,
      estimatedSize: `${Math.round((processedImage.base64?.length || 0) * 0.75 / 1024)} KB`
    });

    return processedImage;
  } catch (error) {
    console.error('Preprocessing error:', error);
    throw new Error('画像の前処理に失敗しました: ' + error.message);
  }
};

/**
 * 画像のファイルサイズを取得する（概算）
 * @param {string} base64String - Base64文字列
 * @returns {number} ファイルサイズ（バイト）
 */
export const getBase64FileSize = (base64String) => {
  if (!base64String) return 0;

  // Base64文字列の長さから元のバイト数を計算
  // Base64は元のデータを約1.37倍に変換する
  const padding = (base64String.match(/=/g) || []).length;
  const size = (base64String.length * 0.75) - padding;

  return Math.round(size);
};

/**
 * 画像サイズが制限内かチェックする
 * @param {string} base64String - Base64文字列
 * @param {number} maxSizeInMB - 最大サイズ（MB、デフォルト: 4MB）
 * @returns {boolean} 制限内ならtrue
 */
export const isImageSizeValid = (base64String, maxSizeInMB = 4) => {
  const sizeInBytes = getBase64FileSize(base64String);
  const sizeInMB = sizeInBytes / (1024 * 1024);

  console.log('画像サイズチェック:', {
    sizeInMB: sizeInMB.toFixed(2),
    maxSizeInMB,
    isValid: sizeInMB <= maxSizeInMB
  });

  return sizeInMB <= maxSizeInMB;
};
