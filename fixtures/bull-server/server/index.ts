import { BullMonitorExpress } from '@bull-monitor/express';
// import { BullAdapter } from '@bull-monitor/root/bull-adapter';
import { BullMQAdapter } from '@bull-monitor/root/bullmq-adapter';
import express from 'express';
// import Queue from 'bull';
import {
  Queue as BullMqQueue,
  Worker as MqWorker,
  // ConnectionOptions,
} from 'bullmq';
import redis from 'ioredis';

// const QUEUES_AMOUNT = 5;
// const READONLY_QUEUES_AMOUNT = 2;
// const redisUri = process.env.REDIS_URI as string;
// const redisHost = 'redis';
// const port = process.env.PORT;
const port = '3000';
const app = express();
// const bullconnection: ConnectionOptions = {
//   // host: redisHost,
//   host: '172.20.0.20',
//   port: 6379,
//   password: 'eYVX7EwVmmxKPCDmwMtyKVge8oLd2t81',
// };

// const bullconnection = {
//   host: '172.20.0.20',
//   port: 6379,
//   password: 'eYVX7EwVmmxKPCDmwMtyKVge8oLd2t81',
// };

// const redis_client = new redis({
//   port: 6379,
//   host: '172.20.0.20',
//   // password: 'eYVX7EwVmmxKPCDmwMtyKVge8oLd2t81',
// });
// (async () => {
//   await redis_client.set('test_key', 'just a key');
//   const result = await redis_client.keys('*');
//   console.log('result: ', result);
// })();
// const natMap = {
//   "172.20.0.71:6381": {host: '127.0.0.1', port: 6381},
//   "172.20.0.72:6382": {host: '127.0.0.1', port: 6382},
//   "172.20.0.73:6383": {host: '127.0.0.1', port: 6383}
// }
// const natMap = {
//   '172.20.0.71:6381': { host: 'localhost', port: 6381 },
//   '172.20.0.72:6382': { host: 'localhost', port: 6382 },
//   '172.20.0.73:6383': { host: 'localhost', port: 6383 },
// };
// const bullconnection = new redis.Cluster(
//   [
//     { host: 'localhost', port: 6381 },
//     { host: 'localhost', port: 6382 },
//     { host: 'localhost', port: 6383 },
//   ],
//   {
//     redisOptions: {
//       username: 'default',
//       password: 'eYVX7EwVmmxKPCDmwMtyKVge8oLd2t81',
//       tls: undefined,
//     },
//     natMap: natMap,
//     dnsLookup: (address, callback) => callback(null, address),
//     scaleReads: 'slave',
//     enableAutoPipelining: true,
//     enableOfflineQueue: true,
//     enableReadyCheck: true,
//     slotsRefreshTimeout: 500000,
//   }
// );
const bullconnection = new redis.Cluster(
  [
    { host: '172.20.0.71', port: 6381 },
    { host: '172.20.0.72', port: 6382 },
    { host: '172.20.0.73', port: 6383 },
  ],
  {
    redisOptions: {
      username: 'default',
      password: 'eYVX7EwVmmxKPCDmwMtyKVge8oLd2t81',
      tls: undefined,
    },
    // natMap: natMap,
    dnsLookup: (address, callback) => callback(null, address),
    scaleReads: 'slave',
    enableAutoPipelining: true,
    enableOfflineQueue: true,
    enableReadyCheck: true,
    slotsRefreshTimeout: 500000,
  }
);
const mqQueues = [
  new BullMqQueue('metrics_queue', {
    prefix: '{bull_metrics}',
    connection: bullconnection,
  }),
  new BullMqQueue('tagging_queue', {
    prefix: '{bull_tagging}',
    connection: bullconnection,
  }),
  new BullMqQueue('dynamodb_account_queue', {
    prefix: '{bull_dynamodb}',
    connection: bullconnection,
  }),
  new BullMqQueue('assume_account_queue', {
    prefix: '{bull_assumer}',
    connection: bullconnection,
  }),
  new BullMqQueue('describe_queue', {
    prefix: '{bull_describer}',
    connection: bullconnection,
  }),
];
const queue_prefix_lut = [
  { queue: 'metrics_queue', prefix: '{bull_metrics}' },
  { queue: 'tagging_queue', prefix: '{bull_tagging}' },
  { queue: 'dynamodb_account_queue', prefix: '{bull_dynamodb}' },
  { queue: 'assume_account_queue', prefix: '{bull_assumer}' },
  { queue: 'describe_queue', prefix: '{bull_describer}' },
];
mqQueues.forEach((queue) => {
  const queuePrefix = queue_prefix_lut.find((i) => i.queue === queue.name);
  new MqWorker(
    queue.name,
    async (job) => {
      return `some return value from ${job.name}`;
    },
    {
      prefix: queuePrefix && queuePrefix.prefix,
      connection: bullconnection,
    }
  );
});

const monitor = new BullMonitorExpress({
  queues: [
    ...mqQueues.map((queue) => new BullMQAdapter(queue as any)),
    // ...queues.map((queue) => new BullAdapter(queue as any)),
    // ...prefixedQueues.map((queue) => new BullAdapter(queue as any)),
    // ...readonlyQueues.map(
    //   (queue) => new BullAdapter(queue as any, { readonly: true })
    // ),
  ],
  gqlIntrospection: true,
  // metrics: {
  //   collectInterval: { seconds: 30 },
  //   maxMetrics: 10,
  // },
});

monitor.init().then(() => {
  app.use('/', monitor.router);
});

app.listen(port, () => {
  console.log(`Bull server fixture listening at http://localhost:${port}`);
  // console.log('debug: ');
});
