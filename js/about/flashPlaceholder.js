/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../components/immutableComponent')

require('../../less/about/flash.less')

class FlashPlaceholder extends ImmutableComponent {
  constructor () {
    super()
    this.state = {
      flashSubtext: 'on this site.'
    }
    window.addEventListener('message', (event) => {
      if (event.data && event.data.flashOrigin && event.origin) {
        this.setState({
          flashSubtext: `from ${event.data.flashOrigin} on ${event.origin}.`
        })
        // Not sure why but this is needed
        this.forceUpdate()
      }
    })
  }

  render () {
    // TODO: Localization doesn't work due to CORS error from inside iframe
    const flashRightClick = 'Right-click to run Adobe Flash'
    const flashExpirationText = 'Approvals expire 7 days after last site visit.'
    return <div>
      <div className='flashMainContent'>
        <img src='img/bravePluginAlert.png' />
        <div id='flashRightClick'>{flashRightClick}</div>
        <div className='flashSubtext'>{this.state.flashSubtext}</div>
      </div>
      <div className='flashFooter'>
        {flashExpirationText}
      </div>
    </div>
  }
}

module.exports = <FlashPlaceholder />
