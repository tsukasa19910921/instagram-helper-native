module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // 環境変数の読み込み設定
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
      }],
      // 🚨 重要: react-native-reanimated/pluginは必ず最後に配置すること
      'react-native-reanimated/plugin'
    ]
  };
};
