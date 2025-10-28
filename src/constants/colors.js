/**
 * カラー定数ファイル
 * Instagram風のカラースキーム + ダークモード対応
 */
import { useColorScheme } from 'react-native';

/**
 * ライトモードのカラーパレット
 */
export const LIGHT_COLORS = {
  // Instagramグラデーション（ブランドカラー）
  gradient: ['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888'],

  // プライマリーカラー
  primary: '#e6683c',
  secondary: '#dc2743',

  // 背景色
  background: '#f5f5f7',
  cardBackground: '#ffffff',

  // テキスト色
  textPrimary: '#1c1c1e',
  textSecondary: '#8e8e93',

  // ボーダー・区切り線
  border: '#e5e5ea',

  // フィードバックカラー
  success: '#34C759',
  error: '#FF3B30',
  warning: '#FF9500',
  info: '#007AFF'
};

/**
 * ダークモードのカラーパレット
 */
export const DARK_COLORS = {
  // Instagramグラデーション（明暗共通）
  gradient: ['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888'],

  // プライマリーカラー（明暗共通）
  primary: '#e6683c',
  secondary: '#dc2743',

  // 背景色（ダークモード対応）
  background: '#000000',
  cardBackground: '#1c1c1e',

  // テキスト色（ダークモード対応）
  textPrimary: '#ffffff',
  textSecondary: '#98989d',

  // ボーダー・区切り線（ダークモード対応）
  border: '#38383a',

  // フィードバックカラー（ダークモード調整）
  success: '#30D158',
  error: '#FF453A',
  warning: '#FF9F0A',
  info: '#0A84FF'
};

/**
 * テーマカラーを取得するカスタムフック
 * OSのカラースキーム設定に自動対応
 *
 * @returns {Object} 現在のテーマに応じたカラーパレット
 *
 * @example
 * const MyComponent = () => {
 *   const colors = useThemeColors();
 *
 *   return (
 *     <View style={{ backgroundColor: colors.background }}>
 *       <Text style={{ color: colors.textPrimary }}>Hello</Text>
 *     </View>
 *   );
 * };
 */
export const useThemeColors = () => {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
};

/**
 * 後方互換性のため（既存コードでINSTAGRAM_COLORSを使っている場合）
 * @deprecated useThemeColors() を使用してください
 */
export const INSTAGRAM_COLORS = LIGHT_COLORS;
