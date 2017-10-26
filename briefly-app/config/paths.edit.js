const paths = require('./paths.base');

module.exports = {
  dotenv: paths.resolveApp('.env'),
  appBuild: paths.resolveApp('build/edit'),
  appPublic: paths.resolveApp('public'),
  appHtml: paths.resolveApp('public/index.html'),
  appIndexJs: paths.resolveApp('src/index-edit.js'),
  appPackageJson: paths.resolveApp('package.json'),
  appSrc: paths.resolveApp('src'),
  yarnLockFile: paths.resolveApp('yarn.lock'),
  testsSetup: paths.resolveApp('src/setupTests.js'),
  appNodeModules: paths.resolveApp('node_modules'),
  publicUrl: 'https://every-letter.com/briefly',
  servedPath: 'https://every-letter.com/briefly',
  publicUrl: 'http://localhost:8080/edit:0',
  devServedPath: 'http://localhost:8080/edit:0',
};
