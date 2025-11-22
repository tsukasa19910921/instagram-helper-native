// src/services/adManager.mock.js
// ExpoGo用の広告マネージャーモック

/**
 * 広告をロード（モック版 - 何もしない）
 * @returns {Promise<boolean>} 常にtrue
 */
export const loadInterstitialAd = () => {
  console.log('[ExpoGoモック] 広告ロードをスキップします');
  return Promise.resolve(true);
};

/**
 * 広告を表示（モック版 - 何もしない）
 * @returns {Promise<void>} 即座に解決
 */
export const showInterstitialAd = () => {
  console.log('[ExpoGoモック] 広告表示をスキップします');
  return Promise.resolve();
};

/**
 * 広告をプリロード（モック版 - 何もしない）
 */
export const preloadAd = async () => {
  console.log('[ExpoGoモック] 広告プリロードをスキップします');
};

/**
 * 広告を表示すべきかどうか判定（モック版 - 常にfalse）
 * @returns {boolean} 常にfalse
 */
export const shouldShowAd = () => {
  return false;
};
