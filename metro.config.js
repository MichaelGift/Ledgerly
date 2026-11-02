// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite's web build loads a WebAssembly SQLite.
config.resolver.assetExts.push('wasm');

// expo-sqlite on web needs SharedArrayBuffer, which browsers only enable on cross-origin isolated
// pages. These headers isolate the dev server; in production the service worker (public/sw.js) adds them.
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  return middleware(req, res, next);
};

module.exports = config;
