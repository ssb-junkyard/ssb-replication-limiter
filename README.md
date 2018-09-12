# [WIP] ssb-replication-manager

> Configure and prioritise ebt replication for ssb

[ssb-ebt]() only exposes an api to stop or start replication of a feed. This module wraps it so you can control the maximum number of connections and prioritise who gets replicated first.

Now: 
  - Track how far behind all your feeds are. If they are a long way behind then you have to do a lot of downloading so trigger special mode.
  - Set a threshold to trigger special mode that limits the number of feeds being replicated at once. 
  - Set the max number of feeds to download at once when in special mode.

Later: Prioritising

Things you might want to know about replication:

- You might also want to show the status of certain feeds if you're uploading or downloading them.

- You might want to show when your feed has been replicated to _at least one_ other peer. This is useful if you're about to go offline but want to make sure you latest is propagating out into the scuttle-verse.

- There's a special case too. If you destroy your database locally and have to re-download it from the network then:
  - You want to see status information about that.
  - If you append to your feed before it's done then you fork your feed (which is _bad_).
  - Replication could just wait until your entire feed is down before replication anyone else.
  - (note to self: Mix has done work on this for ticktack)

## API


### Init

```js
var ReplicationManager = require('ssb-replication-manager')
var replicationManger = ReplicationManager(opts)
```
Takes an `opts` object of shape: 

```
{
  maxNumConnections: <num>,
  modeChangeThreshold: <num>
}
```


## Exposes the same methods as [ssb-ebt](https://github.com/ssbc/ssb-ebt)

```js
  replicationManger.replicate(opts)
```
```js
  replicationManger.request(feedId, isReplicationEnabled)
```
```js
  replicationManger.peerStatus(id, cb)
```

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

// selectPeersFarBehind (uses max downloads)
// selectPeersToDisconnect (will be connected and under the threshold)

// Query peerStatus for all the peers we know about.
// then map from ebt peerStatus structure to {[feedId]: behindBy}
// set a really slow scheduler interval for this. 5-10s because otherwise at initial sync we're going to be jumping around a lot between all the feeds.
// Or make a selector that such that, if there is a peer downloading && over the threshold, just don't change anything.
// trigger the side effect which is the call to ebt.request(..., true)

