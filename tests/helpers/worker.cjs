const { Worker } = require('node:worker_threads');
const path = require('node:path');

function runWorker(data, onMessage, { timeoutMs = 15000 } = {}) {
  const worker = new Worker(path.join(__dirname, 'worker-host.cjs'), { workerData: data });
  const runId = data.runId ?? 1;
  const messages = [];
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { worker.terminate(); reject(new Error('Worker test timed out')); }, timeoutMs);
    worker.once('error', error => { clearTimeout(timeout); worker.terminate(); reject(error); });
    worker.on('message', message => {
      messages.push(message);
      if (message.kind === 'ready') worker.postMessage({ type: 'start', runId, config: data.config, reproduce: data.reproduce });
      try { onMessage?.(message, worker, runId); }
      catch (error) { clearTimeout(timeout); worker.terminate(); reject(error); return; }
      if (message.kind === 'event' && message.event.type !== 'progress') {
        clearTimeout(timeout);
        worker.terminate().then(() => resolve({ ...message.event, messages }));
      }
    });
  });
}
module.exports = { runWorker };
