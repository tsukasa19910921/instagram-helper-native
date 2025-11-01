// 環境変数から読み込み（直接URLを書かないこと）
import { API_BASE_URL as ENV_API_BASE_URL } from '@env';

// デフォルトのAPI URL（本番環境用）
const DEFAULT_API_BASE_URL = 'https://instagram-helper.vercel.app/api';

// 環境変数の検証とフォールバック
// .envが存在しない環境（TestFlight等）でもアプリが起動するように、
// デフォルト値でフェイルソフトします
if (!ENV_API_BASE_URL) {
  console.warn(
    '⚠️ API_BASE_URLが.envから読み込めませんでした。\n' +
    `デフォルト値を使用します: ${DEFAULT_API_BASE_URL}`
  );
}

// 環境変数を定数としてエクスポート（無い場合はデフォルト値）
export const API_BASE_URL = ENV_API_BASE_URL || DEFAULT_API_BASE_URL;

// 画像スタイルの選択肢
// 注: labelは翻訳キー、valueは英語スラッグ（API連携用）
export const IMAGE_STYLES = [
  { label: 'imageStyles.original', value: 'original' },
  { label: 'imageStyles.anime', value: 'anime' },
  { label: 'imageStyles.vintage', value: 'vintage' },
  { label: 'imageStyles.sparkle', value: 'sparkle' }
];

// 文章のトーン
// 注: labelは翻訳キー、valueは英語スラッグ（API連携用）
export const TEXT_TONES = [
  { label: 'tones.serious', value: 'serious' },
  { label: 'tones.humorous', value: 'humorous' },
  { label: 'tones.sparkling', value: 'sparkling' },
  { label: 'tones.passionate', value: 'passionate' },
  { label: 'tones.casual', value: 'casual' },
  { label: 'tones.elegant', value: 'elegant' }
];

// 文章のスタイル
// 注: labelは翻訳キー、valueは英語スラッグ（API連携用）
export const TEXT_STYLES = [
  { label: 'styles.masculine', value: 'masculine' },
  { label: 'styles.feminine', value: 'feminine' },
  { label: 'styles.neutral', value: 'neutral' }
];

// ハッシュタグの量
// 注: labelは翻訳キー、valueは英語スラッグ（API連携用）
export const HASHTAG_AMOUNTS = [
  { label: 'hashtags.many', value: 'many' },
  { label: 'hashtags.normal', value: 'normal' },
  { label: 'hashtags.few', value: 'few' }
];

// 言語設定（API生成言語用 - UIロケールとは独立）
// 注: labelは翻訳キー、valueは英語スラッグ（API連携用）
// ⚠️ これはAPI生成言語の設定であり、UIロケール（ja/en）とは別物です
export const LANGUAGES = [
  { label: 'languages.japanese', value: 'japanese' },
  { label: 'languages.english', value: 'english' },
  { label: 'languages.bilingual', value: 'bilingual' }
];
