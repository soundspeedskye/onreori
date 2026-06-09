module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ['./scripts/inlineSupabaseEnv.js', 'react-native-worklets/plugin'],
};
