'use strict';

const path = require('path');
const fs = require('fs');
const url = require('url');

// Make sure any symlinks in the project folder are resolved:
// https://github.com/facebookincubator/create-react-app/issues/637
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

const envPublicUrl = process.env.PUBLIC_URL;

function ensureSlash(path, needsSlash) {
  const hasSlash = path.endsWith('/');
  if (hasSlash && !needsSlash) {
    return path.substr(path, path.length - 1);
  } else if (!hasSlash && needsSlash) {
    return `${path}/`;
  } else {
    return path;
  }
}

const getPublicUrl = appPackageJson =>
  envPublicUrl || require(appPackageJson).homepage;

// We use `PUBLIC_URL` environment variable or "homepage" field to infer
// "public path" at which the app is served.
// Webpack needs to know it to put the right <script> hrefs into HTML even in
// single-page apps that may serve index.html for nested URLs like /todos/42.
// We can't use a relative path in HTML because we don't want to load something
// like /todos/42/static/js/bundle.7289d.js. We have to know the root.
function getServedPath(appPackageJson) {
  const publicUrl = getPublicUrl(appPackageJson);
  const servedUrl =
    envPublicUrl || (publicUrl ? url.parse(publicUrl).pathname : '/');
  return ensureSlash(servedUrl, true);
}

function listDir(root) {
  let ret = [];
  let queue = fs.readdirSync(path.resolve(appDirectory,'public', root));

  while (queue.length > 0) {
    let fpath = path.join(root, queue.pop());
    let fstat = fs.statSync(path.resolve(appDirectory, 'public', fpath));
    if (fstat.isFile()) {
      ret.push({
        type: "file",
        name: fpath,
      });
    } else if (fstat.isDirectory()) {
      ret.push(listDir(fpath));
    }
  }

  return {
    type: "directory",
    name: root,
    children: ret,
  };
}

// config after eject: we're in ./config/
module.exports = {
  resolveApp: resolveApp,
  getPublicUrl: getPublicUrl,
  getServedPath: getServedPath
};
