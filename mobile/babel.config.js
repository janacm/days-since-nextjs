module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo', '@babel/preset-typescript'],
    env: {
      test: {
        presets: ['babel-preset-expo', '@babel/preset-typescript']
      }
    }
  };
};
