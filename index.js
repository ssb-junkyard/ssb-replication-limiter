var Ebt = require('ssb-ebt')

module.exports = {
  init,
  name: Ebt.name,
  version: Ebt.version,
  manifest: Ebt.manifest,
  persmission: Ebt.permissions
}

function init (sbot, config) {
  var ebt = Ebt.init(sbot, config)
  var maxDownloads = 1 // In special mode
  var modeChangeValue = config.modeChangeValue || 50 // Value over which we transition to special prioritising mode where max downloads is enforced. Below that we can just enable all peers in standard ebt mode.

  return {
    request,
    replicate: ebt.replicate,
    peerStatus: ebt.peerStatus,
    setMaxNumDownloads,
    setPeersToPrioritise
  }

  function request (feedId, shouldReplicate) {

  }

  function setMaxNumDownloads (num) {
    maxDownloads = num
  }

  function setPeersToPrioritise (peers) {

  }
}
