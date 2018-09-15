var Store = require('./store')

module.exports = function (opts) {
  opts = opts || {}
  var maxNumConnections = opts.maxNumConnections || 1
  var modeChangeThreshold = opts.modeChangeThreshold || 50
  // var prioritiseFeeds = opts.prioritiseFeeds // TODO: ???

  var store = Store({
    request: opts.request,
    getPeerBehindBy: opts.getPeerBehindBy
  })
  // where getPeerBehindBy takes a feed Id and returns the maximum amount our copy of their feed is behind by.

  store.doSetModeChangeThreshold(modeChangeThreshold)
  store.doSetMaxNumConnections(maxNumConnections)
  store.doStartScheduler(2000)

  return {
    request: function (feedId, isReplicationEnabled) {
      if (isReplicationEnabled) { store.doAddPeer(feedId) } else { store.doRemovePeer(feedId) }
    },
    setModeChangeThreshold: function (threshold) {
      store.doSetModeChangeThreshold(threshold)
    },
    setMaxNumConnections: function (max) {
      store.doSetMaxNumConnections(max)
    }
  }
}
