module.exports = function (config) {
  config.resolve = config.resolve || {};
  config.resolve.alias = Object.assign({}, config.resolve.alias, {
    react: require.resolve('preact/compat'),
    'react-dom': require.resolve('preact/compat')
  });
  return config;
}; 