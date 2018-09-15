var {createSelector} = require('redux-bundler')
var {fromJS} = require('immutable')

const MAX_NUM_CONNECTIONS_SET = 'MAX_NUM_CONNECTIONS_SET'
const SCHEDULER_DID_START = 'SCHEDULER_DID_START'
const SCHEDULER_DID_STOP = 'SCHEDULER_DID_STOP'
const SCHEDULER_DID_TICK = 'SCHEDULER_DID_TICK'
const MODE_CHANGE_THRESHOLD_SET = 'MODE_CHANGE_THRESHOLD_SET'

const initialState = fromJS({
  maxConnectedPeers: 1,
  modeChangeThreshold: 50,
  tickIntervalId: null,
  isSchedulerRunning: false
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
      case SCHEDULER_DID_TICK:
        return state
      default:
        return state
    }
  },
  selectScheduler: function (state) {
    return state.scheduler
  },
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
