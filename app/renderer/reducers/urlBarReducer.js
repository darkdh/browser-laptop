/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const windowConstants = require('../../../js/constants/windowConstants')
const {getSourceAboutUrl, getSourceMagnetUrl, isIntermediateAboutPage, navigatableTypes} = require('../../../js/lib/appUrlUtil')
const {isURL, getUrlFromInput} = require('../../../js/lib/urlutil')
const {activeFrameStatePath, frameStatePath, getFrameByKey, getActiveFrame, tabStatePath} = require('../../../js/state/frameStateUtil')
const urlParse = require('../../common/urlParse')

const updateNavBarInput = (state, loc, framePath) => {
  if (framePath === undefined) {
    framePath = activeFrameStatePath(state)
  }
  state = state.setIn(framePath.concat(['navbar', 'urlbar', 'location']), loc)
  return state
}

const urlBarReducer = (state, action) => {
  switch (action.actionType) {
    case windowConstants.WINDOW_SET_NAVBAR_INPUT:
      state = updateNavBarInput(state, action.location)
      break
    case windowConstants.WINDOW_SET_URL:
      const frame = getFrameByKey(state, action.key)
      const currentLocation = frame.get('location')
      const parsedUrl = urlParse(action.location)

      // For types that are not navigatable, just do a loadUrl on them
      if (!navigatableTypes.includes(parsedUrl.protocol)) {
        if (parsedUrl.protocol !== 'javascript:' ||
            currentLocation.substring(0, 6).toLowerCase() !== 'about:') {
          state = state.mergeIn(frameStatePath(state, action.key), {
            activeShortcut: 'load-non-navigatable-url',
            activeShortcutDetails: action.location
          })
        }
        state = updateNavBarInput(state, frame.get('location'), frameStatePath(state, action.key))
      } else if (currentLocation === action.location) {
        // reload if the url is unchanged
        state = state.mergeIn(frameStatePath(state, action.key), {
          audioPlaybackActive: false,
          activeShortcut: 'reload'
        })
        state = state.mergeIn(tabStatePath(state, action.key), {
          audioPlaybackActive: false
        })
        state = updateNavBarInput(state, frame.get('location'), frameStatePath(state, action.key))
      } else {
        // If the user is changing back to the original src and they already navigated away then we need to
        // explicitly set a new location via webview.loadURL.
        let activeShortcut
        if (frame.get('location') !== action.location &&
            frame.get('src') === action.location &&
            !isIntermediateAboutPage(action.location)) {
          activeShortcut = 'explicitLoadURL'
        }

        state = state.mergeIn(frameStatePath(state, action.key), {
          src: action.location,
          location: action.location,
          activeShortcut
        })
        state = state.mergeIn(tabStatePath(state, action.key), {
          location: action.location
        })
        // Show the location for directly-entered URLs before the page finishes
        // loading
        state = updateNavBarInput(state, action.location, frameStatePath(state, action.key))
      }
      break
    case windowConstants.WINDOW_SET_NAVIGATED:
      action.location = action.location.trim()
      // For about: URLs, make sure we store the URL as about:something
      // and not what we map to.
      action.location = getSourceAboutUrl(action.location) ||
        getSourceMagnetUrl(action.location) ||
        action.location

      if (isURL(action.location)) {
        action.location = getUrlFromInput(action.location)
      }

      const key = action.key || state.get('activeFrameKey')
      state = state.mergeIn(frameStatePath(state, key), {
        location: action.location
      })
      state = state.mergeIn(tabStatePath(state, key), {
        location: action.location
      })
      if (!action.isNavigatedInPage) {
        state = state.mergeIn(frameStatePath(state, key), {
          adblock: {},
          audioPlaybackActive: false,
          computedThemeColor: undefined,
          httpsEverywhere: {},
          icon: undefined,
          location: action.location,
          noScript: {},
          themeColor: undefined,
          title: '',
          trackingProtection: {},
          fingerprintingProtection: {}
        })
        // TODO: This should be moved into a tabs reducer
        state = state.mergeIn(tabStatePath(state, key), {
          audioPlaybackActive: false,
          themeColor: undefined,
          location: action.location,
          computedThemeColor: undefined,
          icon: undefined,
          title: ''
        })
      }

      // Update nav bar unless when spawning a new tab. The user might have
      // typed in the URL bar while we were navigating -- we should preserve it.
      if (!(action.location === 'about:newtab' && !getActiveFrame(state).get('canGoForward'))) {
        const key = action.key || state.get('activeFrameKey')
        state = updateNavBarInput(state, action.location, frameStatePath(state, key))
      }
      break
  }
  return state
}

module.exports = urlBarReducer
