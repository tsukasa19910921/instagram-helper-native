# 広告導入手順書（Google AdMob）

このドキュメントでは、生成AI処理待ち時間に広告を表示する機能を実装する手順を説明します。

## 📋 概要

- **目的**: 生成AI処理中（画像処理中）にインタースティシャル広告（全画面広告）を表示
- **広告プラットフォーム**: Google AdMob（最も一般的で初心者にも使いやすい）
- **実装箇所**: `HomeScreen.js`の`handleProcess`関数内
- **表示タイミング**: 画像処理開始時 → 広告表示 → 処理完了後に結果表示
- **前提条件**: Expo Managed Workflow + EAS Build または Expo Prebuild を使用

> ⚠️ **重要**: このガイドは `react-native-google-mobile-ads` を使用します。Expo managed では config plugin + prebuild が必須です。

---

## ステップ1: Google AdMobアカウントの作成

### 1.1 AdMobアカウント登録
1. [Google AdMob](https://admob.google.com/)にアクセス
2. Googleアカウントでサインイン
3. 「はじめる」をクリックして新規アカウントを作成
4. アプリケーション情報を入力:
   - アプリ名: `Instagram Helper`
   - プラットフォーム: `iOS`と`Android`の両方
   - アプリストアURL: （開発中の場合は後で追加可能）

### 1.2 アプリをAdMobに登録
1. AdMobダッシュボードで「アプリ」→「アプリを追加」
2. プラットフォームを選択（iOS/Android）
3. アプリが公開済みかを選択:
   - **開発中の場合**: 「いいえ」を選択
   - アプリ名を入力: `Instagram Helper`
4. 「アプリを追加」をクリック

### 1.3 広告ユニットIDの取得
1. 追加したアプリを選択
2. 「広告ユニット」→「広告ユニットを追加」
3. 広告フォーマットで「インタースティシャル」を選択
4. 広告ユニット名を入力: `処理中広告`
5. 「広告ユニットを作成」をクリック
6. **広告ユニットIDをメモ**:
   - iOS: `ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY`
   - Android: `ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ`

> ⚠️ **重要**: テスト中はテスト広告IDを使用してください（本番IDを使うとアカウント停止のリスクがあります）

---

## ステップ2: 必要なパッケージのインストール

### 2.1 プロジェクトディレクトリに移動

```bash
cd <プロジェクトルート>/instagram-helper-native
```

> 📝 `<プロジェクトルート>`はあなたの環境に合わせて置き換えてください。

### 2.2 react-native-google-mobile-adsのインストール

```bash
npm install react-native-google-mobile-ads
```

> ⚠️ **重要**: `expo-ads-admob`は非推奨です。必ず`react-native-google-mobile-ads`を使用してください。

### 2.3 環境変数管理ライブラリのインストール

```bash
npm install react-native-dotenv --save-dev
```

### 2.4 babel.config.jsの設定

`babel.config.js`にdotenvのプラグイン設定を追加:

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
        safe: false,
        allowUndefined: true
      }]
    ]
  };
};
```

### 2.5 app.jsonの設定

`app.json`に以下の設定を追加します:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-google-mobile-ads",
        {
          "androidAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY",
          "iosAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~ZZZZZZZZZZ"
        }
      ]
    ]
  }
}
```

> 📝 **アプリIDとユニットIDの違い**:
> - **アプリID**: AdMobでアプリを登録した時に発行されるID（`~`を含む）
> - **ユニットID**: 広告ユニットごとに発行されるID（`/`を含む）

---

## ステップ3: ネイティブプロジェクトのビルド（Expo Prebuild）

### 3.1 ネイティブコードの生成

```bash
npx expo prebuild
```

> 📝 このコマンドで `ios/` と `android/` フォルダが生成され、config plugin の設定が反映されます。

### 3.2 iOSの場合：CocoaPodsのインストール

```bash
cd ios
pod install
cd ..
```

> 📝 Macをお使いの場合のみ実行してください。Windowsの場合はこの手順はスキップできます（Android開発のみ）。

### 3.3 ビルド方法の選択

以下のいずれかの方法でビルドします：

**A. EAS Buildを使う場合（推奨）**
```bash
# EAS CLIのインストール（初回のみ）
npm install -g eas-cli

# ログイン
eas login

# ビルド設定
eas build:configure

# iOSビルド
eas build -p ios --profile development

# Androidビルド
eas build -p android --profile development
```

**B. Xcodeで直接ビルド（iOSのみ・Mac必須）**
```bash
open ios/instagramhelpernative.xcworkspace
```
Xcodeで実機またはシミュレーターを選択してビルドしてください。

---

## ステップ4: 環境変数の設定

### 4.1 .envファイルに広告IDを追加

プロジェクトルートに`.env`ファイルを作成し、以下を追加:

```env
# Google AdMob設定
ADMOB_ANDROID_APP_ID=ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY
ADMOB_IOS_APP_ID=ca-app-pub-XXXXXXXXXXXXXXXX~ZZZZZZZZZZ
ADMOB_ANDROID_INTERSTITIAL_ID=ca-app-pub-XXXXXXXXXXXXXXXX/1234567890
ADMOB_IOS_INTERSTITIAL_ID=ca-app-pub-XXXXXXXXXXXXXXXX/0987654321

# テスト用広告ID（開発中はこちらを使用）
ADMOB_TEST_ANDROID_INTERSTITIAL_ID=ca-app-pub-3940256099942544/1033173712
ADMOB_TEST_IOS_INTERSTITIAL_ID=ca-app-pub-3940256099942544/4411468910
```

> ⚠️ **開発中は必ずテストIDを使用してください**（本番IDでテストするとアカウント停止のリスク）

### 4.2 .gitignoreの確認

`.env`ファイルが`.gitignore`に含まれていることを確認:

```gitignore
# 環境変数
.env
.env.local
```

### 4.3 .env.exampleファイルの作成

他の開発者のために`.env.example`も作成:

```env
# Google AdMob設定
ADMOB_ANDROID_APP_ID=your-android-app-id
ADMOB_IOS_APP_ID=your-ios-app-id
ADMOB_ANDROID_INTERSTITIAL_ID=your-android-unit-id
ADMOB_IOS_INTERSTITIAL_ID=your-ios-unit-id

# テスト用広告ID（開発中はこちらを使用）
ADMOB_TEST_ANDROID_INTERSTITIAL_ID=ca-app-pub-3940256099942544/1033173712
ADMOB_TEST_IOS_INTERSTITIAL_ID=ca-app-pub-3940256099942544/4411468910
```

---

## ステップ5: 広告マネージャーの作成

### 5.1 servicesディレクトリの作成（存在しない場合）

```bash
mkdir -p src/services
```

### 5.2 adManager.jsファイルの作成

`src/services/adManager.js`を作成:

```javascript
// src/services/adManager.js
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
const IS_DEV = __DEV__; // Expo/React Nativeの組み込み変数

// 広告ユニットIDの取得
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
  requestNonPersonalizedAdsOnly: false,
});

/**
 * 広告をロード（事前ロード）
 * @returns {Promise<boolean>} ロード成功時はtrue
 */
export const loadInterstitialAd = () => {
  return new Promise((resolve, reject) => {
    // 既にロード済みの場合はすぐに解決
    if (interstitial.loaded) {
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
    interstitial.load();
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
        loadInterstitialAd().catch(console.error);
        resolve();
      }
    );

    // 広告表示
    interstitial.show();
  });
};

/**
 * 広告をプリロード（アプリ起動時に呼び出す）
 */
export const preloadAd = async () => {
  try {
    await loadInterstitialAd();
    console.log('広告のプリロードが完了しました');
  } catch (error) {
    console.error('広告のプリロードに失敗しました:', error);
  }
};
```

---

## ステップ6: HomeScreen.jsへの実装

### 6.1 adManagerのインポート

`HomeScreen.js`の先頭に以下を追加:

```javascript
// 広告マネージャーのインポート
import { showInterstitialAd, preloadAd } from '../services/adManager';
```

### 6.2 広告のプリロード（アプリ起動時）

`useEffect`内で広告を事前にロード:

```javascript
// 初期設定の読み込み
useEffect(() => {
  loadInitialSettings();
  // 広告を事前にロード
  preloadAd();
}, []);
```

### 6.3 handleProcess関数の修正（改良版: AI処理 → 広告 → 結果表示）

**フロー**: AI処理開始（ローディングで予告） → AI処理完了 → 広告表示 → 結果表示

```javascript
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
  setLoadingMessage('AIが文章を生成中\n広告表示の後に結果が表示されます');

  try {
    // ⭐ ステップ1: 画像の前処理（正方形にトリミング + 圧縮）
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
      hashtagAmount,
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
```

> 💡 **ポイント**: AI処理中にローディングメッセージで「広告表示の後に結果が表示されます」と予告することで、ユーザーは広告が表示されることを理解し、AI処理の待ち時間も有効活用できます。結果を先に取得してから広告を表示するため、広告を閉じるとすぐに結果が見られます。

---

## ステップ7: 動作確認

### 7.1 開発サーバーの起動

```bash
npx expo start
```

### 7.2 テスト手順（改良版: AI処理 → 広告 → 結果表示）

1. ✅ アプリ起動時に広告がプリロードされる（コンソールログを確認）
2. ✅ 画像を選択
3. ✅ 「生成」ボタンをタップ
4. ✅ **すぐにAI処理が開始される**
   - ローディング表示: 「AIが文章を生成中 広告表示の後に結果が表示されます」
5. ✅ AI処理が完了する（数秒〜十数秒）
6. ✅ ローディングが消えて、**テスト広告が全画面表示される**
7. ✅ 広告を閉じる（×ボタンまたは「広告をスキップ」）
8. ✅ **すぐに結果が表示される**（生成されたキャプション）
9. ✅ 成功アラート「生成が完了しました」が表示される

### 7.3 確認ポイント

- [ ] 「生成」ボタンタップ後、すぐにAI処理が開始されるか
- [ ] ローディングメッセージに「広告表示の後に結果が表示されます」と表示されるか
- [ ] AI処理完了後、広告が正しく表示されるか
- [ ] 広告を閉じた後、**すぐに**結果が表示されるか（待ち時間なし）
- [ ] 広告表示失敗時も結果が正常に表示されるか
- [ ] 2回目以降も同じフロー（AI処理 → 広告 → 結果）で動作するか

---

## ステップ8: iOSプライバシー設定（App Store審査に必須）

### 8.1 App Tracking Transparency (ATT) の設定

iOS 14以降では、IDFAを使用する場合にユーザーの許可が必要です。

#### Info.plistの設定

`ios/instagramhelpernative/Info.plist`に以下を追加:

```xml
<key>NSUserTrackingUsageDescription</key>
<string>このアプリは、あなたに関連性の高い広告を表示するために、他社のアプリやWebサイトでのアクティビティを追跡します。</string>
```

#### ATTダイアログの表示

アプリ起動時または初回広告表示前にATTダイアログを表示:

```bash
npm install react-native-tracking-transparency
```

`App.js`または`HomeScreen.js`に以下を追加:

```javascript
import { requestTrackingPermission } from 'react-native-tracking-transparency';

useEffect(() => {
  // ATT許可リクエスト
  const requestTracking = async () => {
    const trackingStatus = await requestTrackingPermission();
    console.log('トラッキング許可状態:', trackingStatus);
  };

  // iOS 14以降のみ
  if (Platform.OS === 'ios') {
    requestTracking();
  }
}, []);
```

### 8.2 EU圏ユーザー向けの同意管理（GDPR対応）

EU圏のユーザーには、広告パーソナライゼーションの同意取得が必要です。

#### User Messaging Platform (UMP) SDKの導入（オプション）

```bash
npm install @react-native-firebase/app @react-native-firebase/consent
```

詳細は[Google UMP SDK公式ドキュメント](https://developers.google.com/admob/ump/ios/quick-start)を参照してください。

#### 簡易的な対応（非パーソナライズ広告の使用）

EU圏ユーザーには非パーソナライズ広告を表示する設定:

```javascript
// adManager.jsで設定
const interstitial = InterstitialAd.createForAdRequest(getAdUnitId(), {
  requestNonPersonalizedAdsOnly: true, // 非パーソナライズ広告のみ
});
```

### 8.3 App Store Connect での設定

App Store Connect でアプリを登録する際、以下の質問に回答:

1. **「このアプリは広告トラッキングを行いますか？」** → **はい**
2. **「使用するトラッキングドメイン」** → Google AdMobのドメインを選択
3. **「プライバシーポリシーURL」** → あなたのプライバシーポリシーのURL

---

## ステップ9: 本番環境への対応

### 9.1 本番広告IDの設定

1. `.env`ファイルで本番広告IDを設定
2. `__DEV__`は自動的にfalseになるので、特に変更は不要

> 📝 `__DEV__`はReact Nativeの組み込み変数で、本番ビルド時には自動的に`false`になります。

### 9.2 app.jsonの本番設定確認

```json
{
  "expo": {
    "android": {
      "config": {
        "googleMobileAdsAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY"
      }
    },
    "ios": {
      "config": {
        "googleMobileAdsAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~ZZZZZZZZZZ"
      }
    }
  }
}
```

### 9.3 プライバシーポリシーの作成

AdMob利用には**プライバシーポリシー**が必須です:

#### 必須記載事項

1. 広告配信事業者（Google）が使用するCookieについて
2. ユーザーがCookieの使用を無効化する方法
3. 第三者配信による広告サービスの利用
4. データの収集方法と使用目的

#### プライバシーポリシーの設置場所

1. Webサイトに公開（推奨）
2. アプリ内の「設定」や「情報」画面にリンクを表示
3. App Store/Google Playの申請時にURLを記載

#### テンプレート例

[Google AdMob プライバシーポリシー要件](https://support.google.com/admob/answer/6128543)を参考に作成してください。

---

## ステップ10: 高度な設定（オプション）

### 10.1 広告表示頻度の制限（ユーザー体験の向上）

ユーザー体験を損なわないよう、広告表示頻度を制限:

#### メモリベース（アプリ起動中のみ有効）

```javascript
// adManager.js に追加
let lastAdShowTime = 0;
const AD_INTERVAL = 3 * 60 * 1000; // 3分間隔

export const shouldShowAd = () => {
  const now = Date.now();
  if (now - lastAdShowTime < AD_INTERVAL) {
    return false;
  }
  lastAdShowTime = now;
  return true;
};
```

#### AsyncStorageベース（日を跨いで制限したい場合）

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const AD_COUNT_KEY = 'ad_count';
const MAX_ADS_PER_DAY = 5;

export const shouldShowAd = async () => {
  try {
    const today = new Date().toDateString();
    const data = await AsyncStorage.getItem(AD_COUNT_KEY);
    const adData = data ? JSON.parse(data) : { date: today, count: 0 };

    // 日付が変わったらリセット
    if (adData.date !== today) {
      adData.date = today;
      adData.count = 0;
    }

    // 1日の上限チェック
    if (adData.count >= MAX_ADS_PER_DAY) {
      return false;
    }

    // カウント増加
    adData.count++;
    await AsyncStorage.setItem(AD_COUNT_KEY, JSON.stringify(adData));
    return true;
  } catch (error) {
    console.error('広告頻度チェックエラー:', error);
    return true; // エラー時は表示を許可
  }
};
```

`handleProcess`で使用:

```javascript
// 広告を表示（頻度制限あり）
if (shouldShowAd()) {
  try {
    await showInterstitialAd();
  } catch (adError) {
    console.warn('広告表示エラー:', adError);
  }
}
```

### 10.2 リワード広告の導入（追加収益化）

処理回数制限を設けて、広告視聴で追加回数を獲得する仕組み:

```javascript
import { RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';

// リワード広告のインスタンス
const rewarded = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID);

// ユーザーが広告を最後まで視聴した時
rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
  console.log('報酬を獲得:', reward);
  // 追加の処理回数を付与
  grantExtraUsage();
});
```

---

---

## トラブルシューティング

### 問題1: 「@env からインポートできない」エラー

**原因**: babel.config.jsの設定が反映されていない

**対策**:
1. Metro bundlerを完全に停止
2. キャッシュをクリア: `npx expo start -c`
3. node_modulesを再インストール: `rm -rf node_modules && npm install`

### 問題2: 広告が表示されない

**原因と対策**:
- ❌ 本番IDをテスト環境で使用 → テストIDを使用
- ❌ 広告ユニットIDが間違っている → AdMobダッシュボードで確認
- ❌ 広告がロードされていない → `preloadAd()`を呼び出す
- ❌ インターネット接続がない → ネットワークを確認

### 問題3: 「広告がロードされていません」エラー

**対策**:
```javascript
// ロード状態を確認してから表示
const showAdSafely = async () => {
  try {
    if (!interstitial.loaded) {
      await loadInterstitialAd();
    }
    await showInterstitialAd();
  } catch (error) {
    console.warn('広告表示をスキップ:', error);
  }
};
```

### 問題4: 「prebuild後にビルドできない」エラー

**原因**: ネイティブモジュールの依存関係の問題

**対策（iOS）**:
```bash
cd ios
pod deintegrate
pod install
cd ..
```

**対策（Android）**:
```bash
cd android
./gradlew clean
cd ..
```

### 問題5: アカウント停止のリスク

**重要な注意事項**:
- ⚠️ 自分の広告を繰り返しクリックしない
- ⚠️ テスト中は必ずテストIDを使用
- ⚠️ 無効なトラフィック（ボットなど）を送信しない
- ⚠️ プライバシーポリシーを必ず設置

---

---

## まとめ

### 実装完了チェックリスト

#### 基本設定
- [ ] AdMobアカウント作成完了
- [ ] 広告ユニットID（iOSまたはAndroid）取得完了
- [ ] `react-native-google-mobile-ads`インストール完了
- [ ] `react-native-dotenv`インストール・設定完了
- [ ] `babel.config.js`設定完了
- [ ] `app.json`に config plugin 追加完了
- [ ] `npx expo prebuild`実行完了
- [ ] iOSの場合: `pod install`実行完了

#### コード実装
- [ ] `.env`ファイルに広告ID設定完了
- [ ] `adManager.js`作成完了
- [ ] `HomeScreen.js`に広告表示実装完了
- [ ] テスト環境で動作確認完了

#### 本番対応（必須）
- [ ] iOSの場合: `Info.plist`にATT説明文追加完了
- [ ] iOSの場合: ATTダイアログ実装完了
- [ ] プライバシーポリシー作成・公開完了
- [ ] App Store Connect / Google Play Console でプライバシー情報登録完了

### 次のステップ

1. ✅ テスト環境で動作確認完了
2. ✅ 本番広告IDに切り替え
3. 📊 AdMobダッシュボードで収益を確認
4. 🎯 ユーザーフィードバックを基に広告表示タイミングを最適化
5. 🚀 App Store/Google Playに公開

### よくある質問（FAQ）

**Q1: 改良版（AI処理 → 広告 → 結果）のメリットは？**
A: ユーザーが「生成」ボタンをタップした直後にAI処理が始まるため、待たされている感覚が減ります。また、ローディングメッセージで「広告表示の後に結果が表示されます」と予告することで、広告が表示されることを理解でき、AI処理完了後にスムーズに広告を見ることができます。広告を閉じると結果がすぐに表示されるため、ユーザー体験が向上します。

**Q2: ローディングメッセージは多言語対応されていますか？**
A: はい、対応済みです！`t('loading.generatingWithAd')`で翻訳キーを使用しています。
- 日本語: 「AIが文章を生成中 広告表示の後に結果が表示されます」
- 英語: 「AI is generating text Results will be displayed after the ad」
翻訳を変更したい場合は、`src/i18n/locales/ja.json`と`en.json`を編集してください。

**Q3: iOSだけで実装したい場合は？**
A: Android関連の設定（広告ID、app.json設定）はスキップ可能です。

**Q4: 開発中にテスト広告がすぐ表示されるようにするには？**
A: `adManager.js`の`AD_INTERVAL`を短く設定するか、頻度制限を一時的に無効化してください。

**Q5: 広告収益の目安は？**
A: アプリのジャンル、ユーザー数、広告表示回数により大きく変動します。AdMobダッシュボードで確認してください。

**Q6: Expo Goで動作確認できますか？**
A: いいえ。`react-native-google-mobile-ads`はカスタムネイティブコードなので、Expo Goでは動作しません。EAS BuildまたはExpo Prebuildが必要です。

---

## 参考リンク

### 公式ドキュメント
- [Google AdMob公式サイト](https://admob.google.com/)
- [react-native-google-mobile-ads ドキュメント](https://docs.page/invertase/react-native-google-mobile-ads)
- [Expo Config Plugins](https://docs.expo.dev/guides/config-plugins/)
- [EAS Build ドキュメント](https://docs.expo.dev/build/introduction/)

### ポリシー・規約
- [AdMobポリシー](https://support.google.com/admob/answer/6128543)
- [AdMobプライバシー要件](https://support.google.com/admob/answer/6128543)
- [App Tracking Transparency](https://developer.apple.com/documentation/apptrackingtransparency)

### 追加リソース
- [Google UMP SDK（GDPR対応）](https://developers.google.com/admob/ump/ios/quick-start)
- [react-native-tracking-transparency](https://github.com/vladimirgoncharov/react-native-tracking-transparency)

---

**作成日**: 2025年11月13日（v3.0 - 改良版）
**対象アプリ**: Instagram Helper Native
**広告プラットフォーム**: Google AdMob
**前提環境**: Expo Managed Workflow + EAS Build / Expo Prebuild
**広告表示フロー**: AI処理 → 広告表示 → 結果表示（改良版）
