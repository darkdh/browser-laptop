/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../components/immutableComponent')

class FlashPlaceholder extends ImmutableComponent {
  render () {
    return <div>
    {'hello world'}
    </div>
  }
}

module.exports = <FlashPlaceholder />
