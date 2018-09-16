'use strict'
var {Record, Map} = require('immutable')
var {createSelector} = require('redux-bundler')

var PeerRecord = Record({
  isReplicating: false,
  aheadBy: 0 // positive means we are behind and can download. Negative means we are ahead and could allow them to request it if they want.
})

var initialState = Map({})

const PEER_ADDED = 'PEER_ADDED'
const PEER_REMOVED = 'PEER_REMOVED'
const PEER_AHEAD_BY = 'PEER_AHEAD_BY'
const PEERS_STARTED_REPLICATING = 'PEERS_STARTED_REPLICATING'
const PEERS_STOPPED_REPLICATING = 'PEERS_STOPPED_REPLICATING'

module.exports = {
  name: 'peers',
  getReducer: function () {
    if (this.initialState) {
      initialState = this.initialState
    }
    return this._reducer
  },
  _reducer: function (state = initialState, action) {
    switch (action.type) {
      case PEER_ADDED: {
        const { feedId } = action.payload

        return state.update(feedId, function (peer) {
          if (!peer) {
            peer = PeerRecord({})
          }
          return peer
        })
      }
      case PEER_REMOVED: {
        const { feedId } = action.payload

        return state.delete(feedId)
      }
      case PEER_AHEAD_BY: {
        const { feedId, aheadBy } = action.payload

        return state.setIn([feedId, 'aheadBy'], aheadBy)
      }
      case PEERS_STARTED_REPLICATING: {
        const { feedIds } = action.payload

        const updatedPeers = feedIds
          .reduce(function (currentState, feedId) {
            return currentState
              .setIn([feedId, 'isReplicating'], true)
          }, state)

        return state.mergeDeep(updatedPeers)
      }
      case PEERS_STOPPED_REPLICATING: {
        const { feedIds } = action.payload

        const updatedPeers = feedIds
          .reduce(function (currentState, feedId) {
            return currentState
              .setIn([feedId, 'isReplicating'], false)
          }, state)

        return state.mergeDeep(updatedPeers)
      }
      default:
        return state
    }
  },
  doAddPeer,
  doRemovePeer,
  doStartPeersReplicating,
  doStopPeersReplicating,
  doPeerAheadBy,

  selectPeers,
  selectReplicatingPeers: createSelector('selectPeers', function (peers) {
    return peers.filter(function (peer) {
      return peer.get('isReplicating')
    })
  }),
  selectNotReplicatingPeers: createSelector('selectPeers', function (peers) {
    return peers.filter(function (peer) {
      return !peer.get('isReplicating')
    })
  }),
  selectNumberOfReplicatingPeers: createSelector('selectReplicatingPeers', function (peers) {
    return peers.size
  }),
  selectPeersOverThreshold: createSelector('selectPeers', 'selectThreshold', function (peers, threshold) {
    return peers.filter(function (peer) {
      return peer.get('aheadBy') > threshold
    })
  }),
  selectPeersToStartReplicating: createSelector('selectPeersOverThreshold', 'selectMaxConnectedPeers', 'selectNumberOfReplicatingPeers', function (peers, max, numberOfReplicatingPeers) {
    return peers
      .filter(function (peer) {
        return !peer.get('isReplicating')
      })
      .take(max - numberOfReplicatingPeers)
  }),
  selectPeersToStopReplicating: createSelector('selectReplicatingPeers', 'selectThreshold', function (peers, threshold) {
    return peers.filter(function (peer) {
      return peer.get('aheadBy') < threshold
    })
  }),
  reactPeersToStartReplicatingUnlimitedMode: createSelector('selectNotReplicatingPeers', 'selectIsUnLimitedMode', function (peers, isUnLimitedModeEnabled) {
    if (peers.size === 0 || !isUnLimitedModeEnabled) return // TODO: there's probably a nice place to check isLimitedMode.
    console.log('start replicating peers unlimited mode: ', peers.size)
    return doStartPeersReplicating({feedIds: peers.keySeq()})
  }),
  reactPeersToStartReplicating: createSelector('selectPeersToStartReplicating', 'selectIsLimitedMode', function (peers, isLimitedModeEnabled) {
    if (peers.size === 0 || !isLimitedModeEnabled) return // TODO: there's probably a nice place to check isLimitedMode.
    console.log('Do limited mode replication of peers:', peers)
    return doStartPeersReplicating({feedIds: peers.keySeq()})
  }),
  reactPeersToStopReplicating: createSelector('selectPeersToStopReplicating', 'selectIsLimitedMode', function (peers, isLimitedModeEnabled) {
    if (peers.size === 0 || !isLimitedModeEnabled) return
    return doStopPeersReplicating({feedIds: peers.keySeq()})
  }),

  PeerRecord
}

function selectPeers (state) {
  return state.peers
}

function doPeerAheadBy ({feedId, aheadBy}) {
  return {
    type: PEER_AHEAD_BY,
    payload: {
      feedId,
      aheadBy
    }
  }
}

function doStartPeersReplicating ({feedIds}) {
  return function ({dispatch, request}) {
    dispatch({
      type: PEERS_STARTED_REPLICATING,
      payload: {feedIds}
    })
    feedIds.forEach(function (feedId) {
      request(feedId, true)
    })
  }
}

function doStopPeersReplicating ({feedIds}) {
  return function ({dispatch, request}) {
    dispatch({
      type: PEERS_STOPPED_REPLICATING,
      payload: {feedIds}
    })
    feedIds.forEach(function (feedId) {
      request(feedId, false)
    })
  }
}

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
