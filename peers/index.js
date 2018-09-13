'use strict'
var {Record, Map, List} = require('immutable')
var {createSelector} = require('redux-bundler')
var { parseAddress, feedIdRegex: FeedIdRegex } = require('ssb-ref')

var PeerRecord = Record({
  id: '', // A multiserver address
  isReplicating: false,
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
  selectReplicatingPeers: createSelector('selectPeers', function (peers) {
    return peers.filter(function (peer) {
      return peer.get('isReplicating')
    })
  }),
  selectNumberOfReplicatingPeers: createSelector('selectReplicatingPeers', function (peers) {
    return peers.size
  }),
  selectPeersOverThreshold: createSelector('selectPeers', 'selectThreshold', function (peers, threshold) {
    return peers.filter(function (peer) {
      return peer.get('behindBy') > threshold
    })
  }),
  selectPeersToStartReplicating: createSelector('selectPeersOverThreshold', 'selectMax', 'selectNumberOfReplicatingPeers', function (peers, max, numberOfReplicatingPeers) {
    return peers
      .filter(function (peer) {
        return !peer.get('isReplicating')
      })
      .take(max - numberOfReplicatingPeers)
  }),
  selectPeersToStopReplicating: createSelector('selectReplicatingPeers', 'selectThreshold', function (peers, threshold) {
    return peers.filter(function (peer) {
      return peer.get('behindBy') < threshold
    })
  }),
  reactPeersToStartReplicating: createSelector('selectPeersToStartReplicating', function (peers) {
    // need to use the dispatch multi pattern here I think.

  }),
  reactPeersToStopReplicating: createSelector('selectPeersToStopReplicating', function (peers) {
    // need to use the dispatch multi pattern here I think.

  }),

  PeerRecord
}

function selectPeers (state) {
  return state.peers
}

const PEER_ADDED = 'PEER_ADDED'
const PEER_REMOVED = 'PEER_REMOVED'
const PEER_BEHIND_BY_SET = 'PEER_BEHIND_BY_SET'
const PEER_STARTED_REPLICATING = 'PEER_STARTED_REPLICATING'
const PEER_STOPPED_REPLICATING = 'PEER_STOPPED_REPLICATING'

function doAddPeer ({feedId}) {
  return {
    type: PEER_ADDED,
    payload: {
      feedId
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
