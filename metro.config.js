// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

module.exports = (async () => {
  const {
    resolver: { sourceExts, assetExts },
  } = await getDefaultConfig(__dirname);

  const defaultSourceExts = [...sourceExts, "svg", "mjs", "cjs"];

  return {
    resolver: {
      extraNodeModules: require("expo-crypto-polyfills"),
      assetExts: assetExts.filter((ext) => ext !== "svg"),
      sourceExts: process.env.TEST_REACT_NATIVE
        ? ["e2e.js"].concat(defaultSourceExts)
        : defaultSourceExts,
      // unstable_enablePackageExports: true,
    },
    transformer: {
      babelTransformerPath: require.resolve("react-native-svg-transformer"),
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
    },
  };
})();
