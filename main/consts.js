'use strict'

const os = require('os')
const packageJson = require('../package.json')
const path = require('path')
const { app } = require('electron')

module.exports = Object.freeze({
  CACHE_HOME: getCacheHome(),
  IS_MAC: os.platform() === 'darwin',
  IS_WIN: os.platform() === 'win32',
  IS_APPIMAGE: typeof process.env.APPIMAGE !== 'undefined',
  STATION_VERSION: packageJson.version,
  ELECTRON_VERSION: process.versions.electron
})

// Replace with `app.get('localUserData')` after this PR is landed & released:
// https://github.com/electron/electron/pull/34337
function getCacheHome () {
  const platform = os.platform()
  switch (platform) {
    case 'darwin': // macOS
      return path.join(app.getPath('home'), 'Library', 'Caches', app.name)
    case 'win32':
      if (!process.env.LOCALAPPDATA) throw new Error('Unsupported Windows environment: LOCALAPPDATA must be set.')
      return path.join(process.env.LOCALAPPDATA, app.name)
    case 'linux':
      return path.join(
        process.env.XDG_CACHE_HOME || path.join(app.getPath('home'), '.cache'),
        app.name
      )
    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}
