module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
          alias: {
            // Любой импорт 'expo-linear-gradient' пойдёт в нашу безопасную обёртку
            'expo-linear-gradient': './lib/expo-linear-gradient-safe',
          },
        },
      ],
      'react-native-reanimated/plugin', // можно оставить
    ],
  };
};
