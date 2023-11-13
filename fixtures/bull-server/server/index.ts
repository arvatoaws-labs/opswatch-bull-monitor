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

const env = process.env.ENVIRONMENT ?? 'production';
const mode = process.env.MODE ?? '';
const port = process.env.PORT;
const app = express();
const queues = process.env.QUEUES!.split(',');
const prefixes = process.env.PREFIXES!.split(',');
const redis_user =
  env === 'local' || env === 'dev' ? 'default' : mode.replaceAll('_', '');
const redis_user_bull =
  env === 'local' || env === 'dev' ? 'default' : redis_user + 'bull';

let bullConf = [
  {
    port: 6379,
    host: process.env.BULL_REDIS_HOST,
  },
];
if (env === 'local') {
  const hosts = (process.env.BULL_REDIS_HOST ?? '').split(',');
  const ports = (process.env.BULL_REDIS_PORT ?? '').split(',');
  bullConf = [];
  for (let i = 0; i < hosts.length; i++) {
    bullConf.push({
      host: hosts[i],
      port: parseInt(ports[i]),
    });
  }
}
const bullconnection = new redis.Cluster(bullConf, {
  redisOptions: {
    username: redis_user_bull,
    password: process.env.REDIS_PW_BULL,
    tls: env !== 'local' && env !== 'dev' ? {} : undefined,
  },
  dnsLookup: (address: string, callback: (e: any, a: string) => void) =>
    callback(null, address),
  scaleReads: 'slave',
  enableAutoPipelining: false, //what is this for??
  enableOfflineQueue: true,
  enableReadyCheck: true,
  slotsRefreshTimeout: 500000,
});

const mqQueues: any[] = [];
const queue_prefix_lut: { queue: string; prefix: string }[] = [];
for (let i = 0; i < queues.length; i++) {
  mqQueues.push(
    new BullMqQueue(queues[i], {
      prefix: prefixes[i],
      connection: bullconnection,
    })
  );
  queue_prefix_lut.push({
    queue: queues[i],
    prefix: prefixes[i],
  });
}

// mqQueues.forEach((queue) => {
//   const queuePrefix = queue_prefix_lut.find((i) => i.queue === queue.name);
//   new MqWorker(
//     queue.name,
//     async (job) => {
//       return `some return value from ${job.name}`;
//     },
//     {
//       prefix: queuePrefix && queuePrefix.prefix,
//       connection: bullconnection,
//     }
//   );
// });

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
});
