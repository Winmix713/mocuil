require('./register-ts.cjs');
const { parentPort, workerData } = require('node:worker_threads');
const fs = require('node:fs');
const path = require('node:path');
const files = new Map(workerData.manifest.files.map(file => [file.url, file]));

globalThis.self = { onmessage: null, postMessage: event => parentPort.postMessage({ kind: 'event', event }) };
globalThis.fetch = async (url, options = {}) => {
  parentPort.postMessage({ kind: 'request', url });
  if (workerData.hangUrl === url) {
    return new Promise((_, reject) => {
      const abort = () => {
        parentPort.postMessage({ kind: 'aborted', url });
        reject(new DOMException('Aborted', 'AbortError'));
      };
      if (!options.signal) return reject(new Error('Missing AbortSignal'));
      if (options.signal.aborted) return abort();
      options.signal.addEventListener('abort', abort, { once: true });
    });
  }
  options.signal?.throwIfAborted();
  if (url === '/archive-manifest.json') return new Response(JSON.stringify(workerData.manifest));
  const file = files.get(url);
  if (!file) throw new Error(`Unexpected request: ${url}`);
  const bytes = workerData.archiveCache
    ? fs.readFileSync(path.join(workerData.archiveCache, file.sha + '.json'))
    : Buffer.from(workerData.bodies[file.path]);
  return new Response(bytes);
};
require('../../src/audit.worker.ts');
parentPort.on('message', data => globalThis.self.onmessage({ data }));
parentPort.postMessage({ kind: 'ready' });
