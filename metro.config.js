const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure extraNodeModules exists
config.resolver.extraNodeModules = config.resolver.extraNodeModules || {};

// Point 'url' to 'native-url'
config.resolver.extraNodeModules['url'] = path.resolve(__dirname, 'node_modules/native-url');


module.exports = config; 