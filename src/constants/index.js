// 環境変数から読み込み（直接URLを書かないこと）
import { API_BASE_URL as ENV_API_BASE_URL } from '@env';

// 環境変数を定数としてエクスポート
export const API_BASE_URL = ENV_API_BASE_URL;

// 画像スタイルの選択肢
export const IMAGE_STYLES = [
  { label: 'そのまま', value: 'original' },
  { label: 'アニメ風', value: 'anime' },
  { label: 'ビンテージ', value: 'vintage' },
  { label: 'キラキラ', value: 'sparkle' }
];

// 文章のトーン
export const TEXT_TONES = [
  { label: 'まじめ', value: 'serious' },
  { label: 'ユーモア', value: 'humorous' },
  { label: 'キラキラ', value: 'sparkling' },
  { label: '情熱的', value: 'passionate' },
  { label: 'カジュアル', value: 'casual' },
  { label: 'エレガント', value: 'elegant' }
];

// 文章のスタイル
export const TEXT_STYLES = [
  { label: '男性的', value: 'masculine' },
  { label: '女性的', value: 'feminine' },
  { label: '中性的', value: 'neutral' }
];

// ハッシュタグの量
export const HASHTAG_AMOUNTS = [
  { label: '多い', value: 'many' },
  { label: '普通', value: 'normal' },
  { label: '少ない', value: 'few' }
];

// 言語設定
export const LANGUAGES = [
  { label: '日本語', value: 'japanese' },
  { label: '英語', value: 'english' },
  { label: '日英併記', value: 'bilingual' }
];
