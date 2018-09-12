'use strict'
var {Record, Map, List} = require('immutable')
var {createSelector} = require('redux-bundler')
var { parseAddress, feedIdRegex: FeedIdRegex } = require('ssb-ref')

var {
  DISCONNECTED,
  CONNECTED
} = require('./types')

var PeerRecord = Record({
  id: '', // A multiserver address
  connectionState: DISCONNECTED,
  // hypothesis: max downloads is derived from the number of peers that have a a positive behind value.
  behindBy: 0 // positive means we are behind and can download. Negative means we are ahead and could allow them to request it if they want.
})

var initialState = Map({})

module.exports = {
  name: 'peers',
  reducer: function (state = initialState, action) {
    switch (action.type) {
      case PEER_ADDED: {
        const { feedId, isLocal, isLongterm } = action.payload
        const key = getKeyFromAddress(feedId)

        return state.update(feedId, function (peer) {
          if (!peer) {
            peer = PeerRecord({id: feedId, peer: key, isLocal, isLongterm: Boolean(isLongterm)})
          }

          return peer
        })
      }
      case PEER_REMOVED: {
        const { feedId } = action.payload

        return state.delete(feedId)
      }
      case PEER_BEHIND_BY_SET: {
        const { feedId, behindBy } = action.payload

        return state.setIn([feedId, 'behindBy'], behindBy)
      }
      default:
        return state
    }
  },
  doAddPeer,
  doRemovePeer,

  selectPeers,

  PeerRecord
}

function selectPeers (state) {
  return state.peers
}

const PEER_ADDED = 'PEER_ADDED'
const PEER_REMOVED = 'PEER_REMOVED'
const PEER_BEHIND_BY_SET = 'PEER_BEHIND_BY_SET'

function doAddPeer ({feedId, isLocal, isLongterm}) {
  return {
    type: PEER_ADDED,
    payload: {
      feedId,
      isLocal,
      isLongterm
    }
  }
}

function doRemovePeer ({feedId}) {
  return {
    type: PEER_REMOVED,
    payload: {
      feedId
    }
  }
}

var feedIdRegex = new RegExp(FeedIdRegex)

function getKeyFromAddress (address) {
  var {key} = parseAddress(address)
  return key.match(feedIdRegex)[1]
}
