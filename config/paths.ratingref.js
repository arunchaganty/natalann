const paths = require('./paths.base');

module.exports = {
  dotenv: paths.resolveApp('.env'),
  appBuild: paths.resolveApp('build/ratingref'),
  appPublic: paths.resolveApp('public'),
  appHtml: paths.resolveApp('public/index.html'),
  appIndexJs: paths.resolveApp('src/index-rating-ref.js'),
  appPackageJson: paths.resolveApp('package.json'),
  appSrc: paths.resolveApp('src'),
  yarnLockFile: paths.resolveApp('yarn.lock'),
  testsSetup: paths.resolveApp('src/setupTests.js'),
  appNodeModules: paths.resolveApp('node_modules'),
  publicUrl: '{{SERVER_URL}}',
  servedPath: '{{SERVER_URL}}',
  devPublicUrl: 'http://localhost:8080/rating:0',
  devServedPath: 'http://localhost:8080/rating:0',
};
