/**
 * Global setup of the accessibility tests:
 * - serves the package over HTTP on 127.0.0.1, for the page and dist/styles.css;
 * - starts a Playwright server in Playwright's Docker image, the version of @playwright/test, and has the tests connect
 *   to its Chromium. The fonts, the rendering and the browser are the image's, whatever the computer: the screenshots
 *   match. The server runs the very playwright-core of node_modules, mounted read-only: nothing is downloaded in the
 *   container. Its browser reaches the HTTP server through the tests' connection (exposeNetwork).
 * Returns the teardown, which stops both.
 */
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2' };

/** The playwright-core that @playwright/test uses, and its version */
function playwrightCore() {
  const playwright = createRequire(createRequire(import.meta.url).resolve('@playwright/test')).resolve('playwright');
  const manifest = createRequire(playwright).resolve('playwright-core/package.json');
  return { directory: dirname(manifest), version: createRequire(import.meta.url)(manifest).version };
}

/** A server of the package's files, on a free port of 127.0.0.1 */
async function serve() {
  const server = createServer(async (request, response) => {
    const file = normalize(join(root, decodeURIComponent(new URL(request.url, 'http://localhost').pathname)));
    try {
      if (!file.startsWith(root) || file.split(sep).includes('node_modules')) throw new Error('Outside the package');
      const body = await readFile(file);
      response.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return server;
}

/** Playwright's server in its Docker image, listening on `port` of 127.0.0.1; resolves once it listens */
function startBrowser(port) {
  const { directory, version } = playwrightCore();
  const image = `mcr.microsoft.com/playwright:v${version}-noble`;
  const name = `ds-a11y-${process.pid}`;
  const docker = spawn(
    'docker',
    // prettier-ignore
    [
      'run', '--rm', '--init', '--ipc=host', '--name', name, '--user', 'pwuser',
      '--publish', `127.0.0.1:${port}:3000`, '--volume', `${directory}:/playwright-core:ro`,
      image, 'node', '/playwright-core/cli.js', 'run-server', '--port', '3000', '--host', '0.0.0.0',
    ],
    { stdio: ['ignore', 'pipe', 'inherit'] },
  );
  return new Promise((resolve, reject) => {
    docker.on('error', error => reject(new Error(`Docker is needed for the screenshots to match: ${error.message}`)));
    docker.on('exit', code => reject(new Error(`The Playwright container ${image} stopped (${code}): is Docker running?`)));
    docker.stdout.on('data', data => {
      if (String(data).includes('Listening on')) resolve(() => spawn('docker', ['stop', name], { stdio: 'ignore' }));
    });
  });
}

export default async function globalSetup() {
  const server = await serve();
  // A port for the container: the one the system gives a server that closes at once
  const free = await serve();
  const { port } = free.address();
  free.close();
  const stopBrowser = await startBrowser(port);

  process.env.DS_BASE_URL = `http://127.0.0.1:${server.address().port}/`;
  process.env.PW_TEST_CONNECT_WS_ENDPOINT = `ws://127.0.0.1:${port}/`;
  process.env.PW_TEST_CONNECT_EXPOSE_NETWORK = '<loopback>';

  return () => {
    stopBrowser();
    server.close();
  };
}
