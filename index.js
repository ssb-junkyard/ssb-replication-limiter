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

  store.doSetModeChangeThreshold(modeChangeThreshold)
  store.doSetMaxNumConnections(maxNumConnections)
  store.doStartScheduler(4000)

  return {
    request: function (feedId, isReplicationEnabled, priority) {
      if (isReplicationEnabled) { store.doAddPeer({feedId, priority}) } else { store.doRemovePeer({feedId}) }
    },
    setModeChangeThreshold: function (threshold) {
      store.doSetModeChangeThreshold(threshold)
    },
    setMaxNumConnections: function (max) {
      store.doSetMaxNumConnections(max)
    }
  }
}
