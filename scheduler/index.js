var {createSelector} = require('redux-bundler')
var {fromJS} = require('immutable')

const MAX_NUM_CONNECTIONS_SET = 'MAX_NUM_CONNECTIONS_SET'
const SCHEDULER_DID_START = 'SCHEDULER_DID_START'
const SCHEDULER_DID_STOP = 'SCHEDULER_DID_STOP'
const SCHEDULER_DID_TICK = 'SCHEDULER_DID_TICK'
const MODE_CHANGE_THRESHOLD_SET = 'MODE_CHANGE_THRESHOLD_SET'
const LIMITED_MODE_CHANGED = 'LIMITED_MODE_CHANGED'

const mode = {
  LIMITED: 'LIMITED',
  SETTING_LIMITED: 'SETTING_LIMITED',
  UNLIMITED: 'UNLIMITED',
  SETTING_UNLIMITED: 'SETTING_UNLIMITED'
}

const initialState = fromJS({
  maxConnectedPeers: 1,
  modeChangeThreshold: 50,
  tickIntervalId: null,
  isSchedulerRunning: false,
  mode: mode.UNLIMITED
})

module.exports = {
  name: 'scheduler',
  reducer: function (state = initialState, {payload, type}) {
    switch (type) {
      case SCHEDULER_DID_START:
        return state
          .set('tickIntervalId', payload)
          .set('isSchedulerRunning', true)
      case SCHEDULER_DID_STOP:
        return state
          .set('isSchedulerRunning', false)
      case MAX_NUM_CONNECTIONS_SET:
        return state.set('maxConnectedPeers', payload)
      case MODE_CHANGE_THRESHOLD_SET:
        return state.set('modeChangeThreshold', payload)
      case LIMITED_MODE_CHANGED:
        return state.set('mode', payload)
      case SCHEDULER_DID_TICK:
        return state
      default:
        return state
    }
  },
  selectScheduler: function (state) {
    return state.scheduler
  },
  selectIsLimitedMode: createSelector('selectScheduler', function (scheduler) {
    return scheduler.get('mode') === mode.LIMITED
  }),
  selectIsUnLimitedMode: createSelector('selectScheduler', function (scheduler) {
    return scheduler.get('mode') === mode.UNLIMITED
  }),
  selectTickIntervalId: createSelector('selectScheduler', function (scheduler) {
    return scheduler.get('tickIntervalId')
  }),
  selectAppTime: createSelector('selectScheduler', function (scheduler) {
    return scheduler.get('appTime')
  }),
  selectMaxConnectedPeers: createSelector('selectScheduler', function (scheduler) {
    return scheduler.get('maxConnectedPeers')
  }),
  selectIsSchedulerRunning: createSelector('selectScheduler', function (scheduler) {
    return scheduler.get('isSchedulerRunning')
  }),
  selectThreshold: createSelector('selectScheduler', function (scheduler) {
    return scheduler.get('modeChangeThreshold')
  }),
  selectShouldGoToLimitedMode: createSelector('selectIsUnLimitedMode', 'selectPeersOverThreshold', function (isUnLimited, peersOverThreshold) {
    return isUnLimited && peersOverThreshold.size > 0
  }),
  selectShouldLeaveLimitedMode: createSelector('selectIsLimitedMode', 'selectPeersOverThreshold', function (isLimited, peersOverThreshold) {
    return isLimited && peersOverThreshold.size === 0
  }),
  reactShouldGoToLimitedMode: createSelector('selectShouldGoToLimitedMode', function (shouldGoToLimitedMode) {
    if (!shouldGoToLimitedMode) return

    return doSetLimitedMode(true)
  }),
  reactShouldLeaveLimitedMode: createSelector('selectShouldGoToLimitedMode', function (shouldLeaveLimitedMode) {
    if (!shouldLeaveLimitedMode) return

    return doSetLimitedMode(false)
  }),

  doSetMaxNumConnections,
  doStartScheduler,
  doStopScheduler,
  doSchedulerTick,
  doSetModeChangeThreshold
}

function doSetMaxNumConnections (max) {
  return {
    type: MAX_NUM_CONNECTIONS_SET,
    payload: max
  }
}

function doSetLimitedMode (enableLimitedMode) {
  return function ({dispatch, request, getState, store}) {
    // TODO: this is a bit yuck. fix later
    dispatch({type: LIMITED_MODE_CHANGED, payload: enableLimitedMode ? mode.SETTING_LIMITED : mode.SETTING_UNLIMITED})
    // On entering limited mode we need to set all the peers to not replicating
    var peerIds = store.selectPeers(getState()).keySeq()
    dispatch({
      actionCreator: enableLimitedMode ? 'doStopPeersReplicating' : 'doStartPeersReplicating',
      args: [{feedIds: peerIds}]
    })

    // TODO: this is a bit yuck. fix later
    dispatch({type: LIMITED_MODE_CHANGED, payload: enableLimitedMode ? mode.LIMITED : mode.UNLIMITED})
  }
}

function doStartScheduler (interval) {
  return function ({dispatch, getPeerBehindBy, store, getState}) {
    interval = interval || 1000
    var intervalID = setInterval(function () {
      var peers = store.selectPeers(getState())

      peers.forEach(function (peer) {
        var behindBy = getPeerBehindBy(peer)
        var action = store.doPeerBehindBySet({peer, behindBy})
        dispatch(action)
      })

      dispatch(doSchedulerTick(interval))
    }, interval)
    dispatch({type: SCHEDULER_DID_START, payload: intervalID})
  }
}

function doStopScheduler () {
  return function ({ dispatch, store, getState }) {
    var schedulerTimerId = store.selectTickIntervalId(getState())

    clearInterval(schedulerTimerId)
    dispatch({type: SCHEDULER_DID_STOP})
  }
}

function doSchedulerTick (ms) {
  return {
    type: SCHEDULER_DID_TICK,
    payload: ms
  }
}

function doSetModeChangeThreshold (threshold) {
  return {
    type: MODE_CHANGE_THRESHOLD_SET,
    payload: threshold
  }
}
