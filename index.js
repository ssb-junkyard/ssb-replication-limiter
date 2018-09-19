var Store = require('./store')

module.exports = function (opts) {
  opts = opts || {}
  var maxNumConnections = opts.maxNumConnections || 2
  var modeChangeThreshold = opts.modeChangeThreshold || 20

  var store = Store({
    request: opts.request,
    getPeerAheadBy: opts.getPeerAheadBy
  })
  // where getPeerAheadBy takes a feed Id and returns the maximum amount our copy of their feed is behind by.

  console.log('inside rep manager index')
  store.doSetModeChangeThreshold(modeChangeThreshold)
  store.doSetMaxNumConnections(maxNumConnections)
  store.doStartScheduler(2000)
  console.log('started scheduler')

  return {
    request: function (feedId, isReplicationEnabled) {
      if (isReplicationEnabled) { store.doAddPeer({feedId}) } else { store.doRemovePeer({feedId}) }
    },
    setModeChangeThreshold: function (threshold) {
      store.doSetModeChangeThreshold(threshold)
    },
    setMaxNumConnections: function (max) {
      store.doSetMaxNumConnections(max)
    }
  }
}
