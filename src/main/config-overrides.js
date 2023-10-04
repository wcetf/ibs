const path = require('path');
const {
  removeModuleScopePlugin, 
  babelInclude,
} = require('customize-cra');

module.exports = {
  webpack: (config) => {
    config.output.publicPath = './';
    config = removeModuleScopePlugin()(config);
    config = babelInclude([
      path.resolve(__dirname, 'src'),
      path.resolve(__dirname, '../common'),
    ])(config);
    return config;
  },
  devServer: configFunction => {
    return (proxy, allowedHost) => {
      const config = configFunction(proxy, allowedHost);
      config.devMiddleware.writeToDisk = true;
      return config;
    };
  },
};
