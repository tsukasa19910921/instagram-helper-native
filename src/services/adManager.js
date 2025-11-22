// src/services/adManager.js
// Google AdMob インタースティシャル広告の管理

import { Platform } from 'react-native';

// ⚠️ テスト用フラグ: ExpoGoでテストする場合はtrueに設定
// 開発ビルドや本番ビルドではfalseに戻すこと
const DISABLE_ADS_FOR_EXPO_GO = false; // 本番ビルド用: 広告を有効化

// 開発モードかどうか（__DEV__で判定）
// 本番ビルド時には自動的にfalseになります
const IS_DEV = __DEV__;

// インタースティシャル広告のインスタンス
// ExpoGoモードでは null のまま
let interstitial = null;

/**
 * 広告ユニットIDを取得
 * ExpoGoモード以外で実行される
 */
const getAdUnitId = () => {
  const { TestIds } = require('react-native-google-mobile-ads');

  // 環境変数の取得を試行（ExpoGoでは失敗する可能性がある）
  let envVars = {};
  try {
    envVars = require('@env');
  } catch (e) {
    console.warn('環境変数の読み込みに失敗。テストIDを使用します。');
  }

  const {
    ADMOB_ANDROID_INTERSTITIAL_ID,
    ADMOB_IOS_INTERSTITIAL_ID,
    ADMOB_TEST_ANDROID_INTERSTITIAL_ID,
    ADMOB_TEST_IOS_INTERSTITIAL_ID
  } = envVars;

  if (IS_DEV) {
    // 開発中はテストIDを使用
    return Platform.select({
      ios: ADMOB_TEST_IOS_INTERSTITIAL_ID || TestIds.INTERSTITIAL,
      android: ADMOB_TEST_ANDROID_INTERSTITIAL_ID || TestIds.INTERSTITIAL,
    });
  } else {
    // 本番環境では本番IDを使用
    return Platform.select({
      ios: ADMOB_IOS_INTERSTITIAL_ID || TestIds.INTERSTITIAL,
      android: ADMOB_ANDROID_INTERSTITIAL_ID || TestIds.INTERSTITIAL,
    });
  }
};

/**
 * 広告をロード（事前ロード）
 * @returns {Promise<boolean>} ロード成功時はtrue
 */
export const loadInterstitialAd = () => {
  return new Promise((resolve, reject) => {
    // ExpoGoモードでは広告をスキップ
    if (DISABLE_ADS_FOR_EXPO_GO) {
      console.log('[ExpoGoモード] 広告ロードをスキップします');
      resolve(true);
      return;
    }

    // 開発ビルド・本番ビルド用のコード
    const { InterstitialAd, AdEventType } = require('react-native-google-mobile-ads');

    // 初回ロード時に広告インスタンスを作成
    if (!interstitial) {
      interstitial = InterstitialAd.createForAdRequest(getAdUnitId(), {
        requestNonPersonalizedAdsOnly: false,
      });
    }

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
    // ExpoGoモードでは広告をスキップ
    if (DISABLE_ADS_FOR_EXPO_GO) {
      console.log('[ExpoGoモード] 広告表示をスキップします');
      resolve();
      return;
    }

    // 開発ビルド・本番ビルド用のコード
    const { AdEventType } = require('react-native-google-mobile-ads');

    if (!interstitial || !interstitial.loaded) {
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
  // ExpoGoモードでは広告をスキップ
  if (DISABLE_ADS_FOR_EXPO_GO) {
    console.log('[ExpoGoモード] 広告プリロードをスキップします');
    return;
  }

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
