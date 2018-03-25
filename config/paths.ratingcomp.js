const paths = require('./paths.base');

module.exports = {
  dotenv: paths.resolveApp('.env'),
  appBuild: paths.resolveApp('build/ratingcomp'),
  appPublic: paths.resolveApp('public'),
  appHtml: paths.resolveApp('public/index.html'),
  appIndexJs: paths.resolveApp('src/index-ratingcomp.js'),
  appPackageJson: paths.resolveApp('package.json'),
  appSrc: paths.resolveApp('src'),
  yarnLockFile: paths.resolveApp('yarn.lock'),
  testsSetup: paths.resolveApp('src/setupTests.js'),
  appNodeModules: paths.resolveApp('node_modules'),
  publicUrl: '{{SERVER_URL}}',
  servedPath: '{{SERVER_URL}}',
  devPublicUrl: 'http://localhost:8080/ratingcomp:0',
  devServedPath: 'http://localhost:8080/ratingcomp:0',
};
