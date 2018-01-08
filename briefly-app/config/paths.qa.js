const paths = require('./paths.base');

module.exports = {
  dotenv: paths.resolveApp('.env'),
  appBuild: paths.resolveApp('build/qa'),
  appPublic: paths.resolveApp('public'),
  appHtml: paths.resolveApp('public/index.html'),
  appIndexJs: paths.resolveApp('src/index-qa.js'),
  appPackageJson: paths.resolveApp('package.json'),
  appSrc: paths.resolveApp('src'),
  yarnLockFile: paths.resolveApp('yarn.lock'),
  testsSetup: paths.resolveApp('src/setupTests.js'),
  appNodeModules: paths.resolveApp('node_modules'),
  publicUrl: '{{SERVER_URL}}',
  servedPath: '{{SERVER_URL}}',
};
