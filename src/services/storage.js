// ローカルストレージサービス（AsyncStorage使用）
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

// ストレージキーの定義
const STORAGE_KEYS = {
  HISTORY: '@instagram_history',
  SETTINGS: '@instagram_settings',
  FAVORITES: '@instagram_favorites'
};

/**
 * 履歴に保存する
 * @param {Object} item - 保存する履歴アイテム
 * @param {string} item.processedImage - 処理済み画像のURI
 * @param {string} item.caption - 生成されたキャプション
 * @param {string} item.generatedText - 生成された文章
 * @param {string} item.hashtags - 生成されたハッシュタグ
 * @param {Object} item.settings - 使用した設定
 */
export const saveToHistory = async (item) => {
  try {
    const existingHistory = await getHistory();

    // 新しい履歴アイテムを作成
    const newItem = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...item
    };

    // 最新のアイテムを先頭に追加し、最大20件に制限
    const newHistory = [newItem, ...existingHistory].slice(0, 20);

    await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(newHistory));

    console.log('履歴に保存しました:', {
      id: newItem.id,
      totalItems: newHistory.length
    });

    return newItem;
  } catch (error) {
    console.error('Save history error:', error);
    throw new Error('履歴の保存に失敗しました');
  }
};

/**
 * 履歴を取得する
 * @returns {Promise<Array>} 履歴アイテムの配列
 */
export const getHistory = async () => {
  try {
    const history = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);

    if (history) {
      const parsedHistory = JSON.parse(history);
      console.log('履歴を取得しました:', parsedHistory.length, '件');
      return parsedHistory;
    }

    return [];
  } catch (error) {
    console.error('Get history error:', error);
    return [];
  }
};

/**
 * 特定の履歴アイテムを取得する
 * @param {string} id - アイテムのID
 * @returns {Promise<Object|null>} 履歴アイテム、見つからない場合はnull
 */
export const getHistoryItem = async (id) => {
  try {
    const history = await getHistory();
    const item = history.find(h => h.id === id);
    return item || null;
  } catch (error) {
    console.error('Get history item error:', error);
    return null;
  }
};

/**
 * 履歴アイテムを削除する
 * @param {string} id - 削除するアイテムのID
 */
export const deleteHistoryItem = async (id) => {
  try {
    const history = await getHistory();
    const newHistory = history.filter(item => item.id !== id);

    await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(newHistory));

    console.log('履歴アイテムを削除しました:', id);
  } catch (error) {
    console.error('Delete history item error:', error);
    throw new Error('履歴アイテムの削除に失敗しました');
  }
};

/**
 * 履歴をすべてクリアする
 */
export const clearHistory = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.HISTORY);
    console.log('履歴をすべてクリアしました');
  } catch (error) {
    console.error('Clear history error:', error);
    throw new Error('履歴のクリアに失敗しました');
  }
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
      defaultImageStyle: 'original',
      saveToGalleryByDefault: false
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
      defaultImageStyle: 'original',
      saveToGalleryByDefault: false
    };
  }
};

/**
 * お気に入りに追加する
 * @param {Object} item - お気に入りに追加するアイテム
 */
export const addToFavorites = async (item) => {
  try {
    const existingFavorites = await getFavorites();

    const newItem = {
      id: item.id || Date.now().toString(),
      favoritedAt: new Date().toISOString(),
      ...item
    };

    const newFavorites = [newItem, ...existingFavorites];
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(newFavorites));

    console.log('お気に入りに追加しました:', newItem.id);
  } catch (error) {
    console.error('Add to favorites error:', error);
    throw new Error('お気に入りへの追加に失敗しました');
  }
};

/**
 * お気に入りを取得する
 * @returns {Promise<Array>} お気に入りアイテムの配列
 */
export const getFavorites = async () => {
  try {
    const favorites = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);

    if (favorites) {
      return JSON.parse(favorites);
    }

    return [];
  } catch (error) {
    console.error('Get favorites error:', error);
    return [];
  }
};

/**
 * お気に入りから削除する
 * @param {string} id - 削除するアイテムのID
 */
export const removeFromFavorites = async (id) => {
  try {
    const favorites = await getFavorites();
    const newFavorites = favorites.filter(item => item.id !== id);

    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(newFavorites));

    console.log('お気に入りから削除しました:', id);
  } catch (error) {
    console.error('Remove from favorites error:', error);
    throw new Error('お気に入りからの削除に失敗しました');
  }
};

/**
 * アイテムがお気に入りに含まれているかチェックする
 * @param {string} id - チェックするアイテムのID
 * @returns {Promise<boolean>} お気に入りに含まれている場合true
 */
export const isFavorite = async (id) => {
  try {
    const favorites = await getFavorites();
    return favorites.some(item => item.id === id);
  } catch (error) {
    console.error('Check favorite error:', error);
    return false;
  }
};
