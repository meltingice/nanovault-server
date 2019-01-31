const { promisify } = require("util");
const redis = require("redis").createClient({
  host: process.env.REDIS_HOST
});

const getCache = promisify(redis.get).bind(redis);

async function getTimestamp(hash) {
  try {
    const timestamp = await getCache(`block_timestamp/${hash}`);
    if (timestamp) return timestamp;
  } catch (e) {}

  return null;
}

async function getTimestamps(hashes) {
  return new Promise((resolve, reject) => {
    const returnHashes = {};
    redis
      .multi(hashes.map(hash => ["get", `block_timestamp/${hash}`]))
      .exec((err, replies) => {
        if (err) return resolve([]);

        hashes.forEach((hash, index) => (returnHashes[hash] = replies[index]));
        resolve(returnHashes);
      });
  });
}

/**
 * Morph the normal Nano node responses to include timestamps
 */
async function mapAccountHistory(nodeResult) {
  if (!nodeResult || !nodeResult.history) return nodeResult;
  const hashes = nodeResult.history.map(tx => tx.hash);
  const txHashes = await getTimestamps(hashes);

  nodeResult.history = nodeResult.history.map(tx => {
    tx.timestamp = txHashes[tx.hash];
    return tx;
  });

  return nodeResult;
}

async function mapBlocksInfo(blockHashes, nodeResult) {
  if (!nodeResult || !nodeResult.blocks) return nodeResult;
  const txHashes = await getTimestamps(blockHashes);

  for (let block in nodeResult.blocks) {
    nodeResult.blocks[block].timestamp = txHashes[block] || null;
  }

  return nodeResult;
}

async function mapPending(nodeResult) {
  if (!nodeResult || !nodeResult.blocks) return nodeResult;
  const pendingHashes = [];
  for (let block in nodeResult.blocks) {
    pendingHashes.push(block);
  }

  const txHashes = await getTimestamps(pendingHashes);
  for (let block in nodeResult.blocks) {
    nodeResult.blocks[block].timestamp = txHashes[block] || null;
  }

  return nodeResult;
}

module.exports = {
  getTimestamp,
  getTimestamps,
  mapAccountHistory,
  mapBlocksInfo,
  mapPending
};
