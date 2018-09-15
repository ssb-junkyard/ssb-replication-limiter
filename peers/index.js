'use strict'
var {Record, Map} = require('immutable')
var {createSelector} = require('redux-bundler')

var PeerRecord = Record({
  isReplicating: false,
  behindBy: 0 // positive means we are behind and can download. Negative means we are ahead and could allow them to request it if they want.
})

var initialState = Map({})

const PEER_ADDED = 'PEER_ADDED'
const PEER_REMOVED = 'PEER_REMOVED'
const PEER_BEHIND_BY_SET = 'PEER_BEHIND_BY_SET'
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
      case PEER_BEHIND_BY_SET: {
        const { feedId, behindBy } = action.payload

        return state.setIn([feedId, 'behindBy'], behindBy)
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
  doPeerBehindBySet,

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
  selectPeersToStartReplicating: createSelector('selectPeersOverThreshold', 'selectMaxConnectedPeers', 'selectNumberOfReplicatingPeers', function (peers, max, numberOfReplicatingPeers) {
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
    if (peers.size === 0) return
    return doStartPeersReplicating({feedIds: peers.keySeq()})
  }),
  reactPeersToStopReplicating: createSelector('selectPeersToStopReplicating', function (peers) {
    if (peers.size === 0) return
    return doStopPeersReplicating({feedIds: peers.keySeq()})
  }),

  PeerRecord
}

function selectPeers (state) {
  return state.peers
}

function doPeerBehindBySet ({feedId, behindBy}) {
  return {
    type: PEER_BEHIND_BY_SET,
    payload: {
      feedId,
      behindBy
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
