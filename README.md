# [WIP] ssb-replication-manager

> Configure and prioritise ebt replication for ssb

[ssb-ebt](https://github.com/ssbc/ssb-ebt) only exposes an api to stop or start replication of a feed. This module enhances it so you can control the maximum number of simultaneous downloads and prioritise who gets replicated first.

## Now: 

  - [x] Track how far behind all feeds are. If they are a long way behind then you have to do a lot of downloading so trigger special mode.
  - [x] Set a threshold to trigger special mode that limits the number of feeds being replicated at once. 
  - [x] Set the max number of feeds to download at once when in special mode.
  - [x] Expose a mode obs so you can know when it's in limited mode. 
  - [x] Prioritising order of who to replicate first.

## API


### Init

```js
var ReplicationManager = require('ssb-replication-manager')
var replicationManager = ReplicationManager(opts)
```
Takes an `opts` object of shape: 

```
{
  peerStatus: <function> (required)
  request: <function> (required)

  maxNumConnections: <num>,
  modeChangeThreshold: <num>,
}
```

Replication manager has three methods:

###  replicationManager.request(feedId, isReplicationEnabled, [priority])

Same as ssb-ebt's request method. `priority` is optional and defaults to 0. The higer the number, the sooner it will be replicated.

### replicationManager.setModeChangeThreshold(threshold)

Sets a new mode change threshold.

### replicationManager.setMaxNumConnections(max)

Sets a new maximum number of connections allowed when in limited mode.
 
## Install

With [npm](https://npmjs.org/) installed, run

```
$ npm install ssb-replication-manager
```

## Acknowledgments

ssb-replication-manager was inspired by..

## See Also

- [`noffle/common-readme`](https://github.com/noffle/common-readme)

## License

ISC


## TODOs

- [ ] expose a method to check if replication is doing a big sync
  - [ ] use this in the connection manager to stop disconnecting.

- [x] when there are no peers left above the threshold, they can all be replicating

- [x] as soons as one peer goes over the threshold, all replicating peers should be disabled

- [x] selectPeersFarBehind (uses max downloads)

- [x] selectPeersToDisconnect (will be connected and under the threshold)

- [x] Query peerStatus for all the peers we know about.

- [x] then map from ebt peerStatus structure to {[feedId]: behindBy}

- [x] set a really slow scheduler interval for this. 5-10s because otherwise at initial sync we're going to be jumping around a lot between all the feeds.

- [x] Or make a selector that such that, if there is a peer downloading && over the threshold, just don't change anything.

- [x] trigger the side effect which is the call to ebt.request(..., true)

