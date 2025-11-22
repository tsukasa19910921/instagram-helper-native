// src/services/adManager.js
// Google AdMob インタースティシャル広告の管理

import { Platform } from 'react-native';
import {
  InterstitialAd,
  AdEventType,
  TestIds
} from 'react-native-google-mobile-ads';
import {
  ADMOB_ANDROID_INTERSTITIAL_ID,
  ADMOB_IOS_INTERSTITIAL_ID,
  ADMOB_TEST_ANDROID_INTERSTITIAL_ID,
  ADMOB_TEST_IOS_INTERSTITIAL_ID
} from '@env';

// 開発モードかどうか（__DEV__で判定）
// 本番ビルド時には自動的にfalseになります
const IS_DEV = __DEV__;

/**
 * 広告ユニットIDの取得
 * 開発中はテストIDを使用、本番ビルドでは本番IDを使用
 */
const getAdUnitId = () => {
  if (IS_DEV) {
    // 開発中はテストIDを使用
    return Platform.select({
      ios: ADMOB_TEST_IOS_INTERSTITIAL_ID || TestIds.INTERSTITIAL,
      android: ADMOB_TEST_ANDROID_INTERSTITIAL_ID || TestIds.INTERSTITIAL,
    });
  } else {
    // 本番環境では本番IDを使用
    return Platform.select({
      ios: ADMOB_IOS_INTERSTITIAL_ID,
      android: ADMOB_ANDROID_INTERSTITIAL_ID,
    });
  }
};

// インタースティシャル広告のインスタンスを作成
const interstitial = InterstitialAd.createForAdRequest(getAdUnitId(), {
  requestNonPersonalizedAdsOnly: false, // パーソナライズ広告を許可
});

/**
 * 広告をロード（事前ロード）
 * @returns {Promise<boolean>} ロード成功時はtrue
 */
export const loadInterstitialAd = () => {
  return new Promise((resolve, reject) => {
    // 既にロード済みの場合はすぐに解決
    if (interstitial.loaded) {
      console.log('広告は既にロード済みです');
      resolve(true);
      return;
    }

    // ロード完了イベント
    const unsubscribeLoaded = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => {
        console.log('広告のロードが完了しました');
        unsubscribeLoaded();
        resolve(true);
      }
    );

    // ロード失敗イベント
    const unsubscribeError = interstitial.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        console.error('広告のロードに失敗しました:', error);
        unsubscribeError();
        reject(error);
      }
    );

    // 広告のロードを開始
    try {
      interstitial.load();
    } catch (error) {
      console.error('広告ロード開始エラー:', error);
      reject(error);
    }
  });
};

/**
 * 広告を表示
 * @returns {Promise<void>} 広告が閉じられたら解決
 */
export const showInterstitialAd = () => {
  return new Promise((resolve, reject) => {
    if (!interstitial.loaded) {
      console.warn('広告がまだロードされていません');
      reject(new Error('広告がロードされていません'));
      return;
    }

    // 広告が閉じられた時のイベント
    const unsubscribeClosed = interstitial.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        console.log('広告が閉じられました');
        unsubscribeClosed();
        // 次回のために再ロード
        loadInterstitialAd().catch((error) => {
          console.error('広告の再ロードに失敗:', error);
        });
        resolve();
      }
    );

    // 広告表示エラーイベント
    const unsubscribeError = interstitial.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        console.error('広告表示エラー:', error);
        unsubscribeError();
        reject(error);
      }
    );

    // 広告表示
    try {
      interstitial.show();
      console.log('広告を表示しました');
    } catch (error) {
      console.error('広告表示の開始に失敗:', error);
      reject(error);
    }
  });
};

/**
 * 広告をプリロード（アプリ起動時に呼び出す）
 */
export const preloadAd = async () => {
  try {
    console.log('広告のプリロードを開始します...');
    await loadInterstitialAd();
    console.log('広告のプリロードが完了しました');
  } catch (error) {
    console.error('広告のプリロードに失敗しました:', error);
    // エラーが発生してもアプリの動作は継続
  }
};

/**
 * 広告表示頻度の制限（オプション）
 * 最後に広告を表示した時刻を保存
 */
let lastAdShowTime = 0;
const AD_INTERVAL = 3 * 60 * 1000; // 3分間隔

/**
 * 広告を表示すべきかどうか判定
 * @returns {boolean} 表示すべき場合はtrue
 */
export const shouldShowAd = () => {
  const now = Date.now();
  if (now - lastAdShowTime < AD_INTERVAL) {
    console.log('広告表示の頻度制限により、スキップします');
    return false;
  }
  lastAdShowTime = now;
  return true;
};
