'use strict';

var _require = require('immutable'),
    Record = _require.Record,
    Map = _require.Map;

var _require2 = require('redux-bundler'),
    createSelector = _require2.createSelector;

var PeerRecord = Record({
  isReplicating: false,
  priority: 0,
  aheadBy: 0 // positive means we are behind and can download. Negative means we are ahead and could allow them to request it if they want.

});
var initialState = Map({});
const PEER_ADDED = 'PEER_ADDED';
const PEER_REMOVED = 'PEER_REMOVED';
const PEER_AHEAD_BY = 'PEER_AHEAD_BY';
const PEERS_STARTED_REPLICATING = 'PEERS_STARTED_REPLICATING';
const PEERS_STOPPED_REPLICATING = 'PEERS_STOPPED_REPLICATING';
module.exports = {
  name: 'peers',
  getReducer: function getReducer() {
    if (this.initialState) {
      initialState = this.initialState;
    }

    return this._reducer;
  },
  _reducer: function _reducer(state = initialState, action) {
    switch (action.type) {
      case PEER_ADDED:
        {
          const _action$payload = action.payload,
                feedId = _action$payload.feedId,
                priority = _action$payload.priority;
          return state.update(feedId, function (peer) {
            if (!peer) {
              peer = PeerRecord({
                priority
              });
            }

            return peer;
          });
        }

      case PEER_REMOVED:
        {
          const feedId = action.payload.feedId;
          return state.delete(feedId);
        }

      case PEER_AHEAD_BY:
        {
          const _action$payload2 = action.payload,
                feedId = _action$payload2.feedId,
                aheadBy = _action$payload2.aheadBy;
          return state.setIn([feedId, 'aheadBy'], aheadBy);
        }

      case PEERS_STARTED_REPLICATING:
        {
          const feedIds = action.payload.feedIds;
          const updatedPeers = feedIds.reduce(function (currentState, feedId) {
            return currentState.setIn([feedId, 'isReplicating'], true);
          }, state);
          return state.mergeDeep(updatedPeers);
        }

      case PEERS_STOPPED_REPLICATING:
        {
          const feedIds = action.payload.feedIds;
          const updatedPeers = feedIds.reduce(function (currentState, feedId) {
            return currentState.setIn([feedId, 'isReplicating'], false);
          }, state);
          return state.mergeDeep(updatedPeers);
        }

      default:
        return state;
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
      return peer.get('isReplicating');
    });
  }),
  selectNotReplicatingPeers: createSelector('selectPeers', function (peers) {
    return peers.filter(function (peer) {
      return !peer.get('isReplicating');
    });
  }),
  selectNumberOfReplicatingPeers: createSelector('selectReplicatingPeers', function (peers) {
    return peers.size;
  }),
  selectPeersOverThreshold: createSelector('selectPeers', 'selectThreshold', function (peers, threshold) {
    return peers.filter(function (peer) {
      return peer.get('aheadBy') > threshold;
    });
  }),
  selectPeersToStartReplicating: createSelector('selectPeersOverThreshold', 'selectMaxConnectedPeers', 'selectNumberOfReplicatingPeers', function (peers, max, numberOfReplicatingPeers) {
    return peers.filter(function (peer) {
      return !peer.get('isReplicating');
    }).sortBy(function (peer) {
      return peer.get('priority');
    }).reverse().take(max - numberOfReplicatingPeers);
  }),
  selectPeersToStopReplicating: createSelector('selectReplicatingPeers', 'selectThreshold', function (peers, threshold) {
    return peers.filter(function (peer) {
      return peer.get('aheadBy') < threshold;
    });
  }),
  reactPeersToStartReplicatingUnlimitedMode: createSelector('selectNotReplicatingPeers', 'selectIsUnLimitedMode', function (peers, isUnLimitedModeEnabled) {
    if (peers.size === 0 || !isUnLimitedModeEnabled) return; // TODO: there's probably a nice place to check isLimitedMode.

    return doStartPeersReplicating({
      feedIds: peers.keySeq()
    });
  }),
  reactPeersToStartReplicating: createSelector('selectPeersToStartReplicating', 'selectIsLimitedMode', function (peers, isLimitedModeEnabled) {
    if (peers.size === 0 || !isLimitedModeEnabled) return; // TODO: there's probably a nice place to check isLimitedMode.

    return doStartPeersReplicating({
      feedIds: peers.keySeq()
    });
  }),
  reactPeersToStopReplicating: createSelector('selectPeersToStopReplicating', 'selectIsLimitedMode', function (peers, isLimitedModeEnabled) {
    if (peers.size === 0 || !isLimitedModeEnabled) return;
    return doStopPeersReplicating({
      feedIds: peers.keySeq()
    });
  }),
  PeerRecord
};

function selectPeers(state) {
  return state.peers;
}

function doPeerAheadBy({
  feedId,
  aheadBy
}) {
  return {
    type: PEER_AHEAD_BY,
    payload: {
      feedId,
      aheadBy
    }
  };
}

function doStartPeersReplicating({
  feedIds
}) {
  return function ({
    dispatch,
    request
  }) {
    dispatch({
      type: PEERS_STARTED_REPLICATING,
      payload: {
        feedIds
      }
    });
    feedIds.forEach(function (feedId) {
      request(feedId, true);
    });
  };
}

function doStopPeersReplicating({
  feedIds
}) {
  return function ({
    dispatch,
    request
  }) {
    dispatch({
      type: PEERS_STOPPED_REPLICATING,
      payload: {
        feedIds
      }
    });
    feedIds.forEach(function (feedId) {
      request(feedId, false);
    });
  };
}

function doAddPeer({
  feedId,
  priority
}) {
  return {
    type: PEER_ADDED,
    payload: {
      feedId,
      priority
    }
  };
}

function doRemovePeer({
  feedId
}) {
  return {
    type: PEER_REMOVED,
    payload: {
      feedId
    }
  };
}