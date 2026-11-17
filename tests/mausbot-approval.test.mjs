import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { chromium } from 'playwright';

const omb = new URL('../../OpenMausBot/', import.meta.url);
const { launchVerificationServer, runControlOmb } = await import(new URL('scripts/control-omb.ts', omb));
const { createServer } = await import(new URL('node_modules/vite/dist/node/index.js', omb));
const { FAKE_POSTIZ_KEY, startFakePostiz } = await import(new URL('server/testing/fake-postiz.ts', omb));
const { isReadOnlyTool } = await import(new URL('shared/outbound.ts', omb));
const { providerToolAllowKey } = await import(new URL('server/provider-tool-allow.ts', omb));
const root = fileURLToPath(new URL('..', import.meta.url));
// Render the production approval components and store without unrelated full-app dependencies.
const approvalEntry = `
import React from 'react';
import ReactDOM from 'react-dom/client';
import { StoreProvider, useStore } from '/src/state/store.tsx';
import { PendingApprovalPanel, PendingApprovalActions, pendingApprovals } from '/src/components/PendingApproval.tsx';
import { setLanguageChoice } from '/src/lib/language-preference.ts';
import { setAnalyticsEnabled } from '/src/lib/analytics.ts';
import '/src/styles.css';
const h = React.createElement;
function Fixture() {
  const { state } = useStore();
  const bot = state.bots.find(row => row.id === new URLSearchParams(location.search).get('bot'));
  if (!bot) return h('p', null, 'Loading fixture');
  const cards = pendingApprovals(bot.messages);
  return h('main', { className: 'mx-auto max-w-4xl p-8' },
    h('h1', null, bot.name),
    state.error && h('p', { role: 'alert' }, state.error),
    cards.map((pending, index) => h(PendingApprovalPanel, {
      key: pending.requestId, pending, count: cards.length, index, botName: bot.name,
      actions: h(PendingApprovalActions, { pending, threadId: bot.threadId, bot, onCancelTurn: () => {} })
    })),
    h('output', null, cards.length ? 'Waiting for approval' : 'No pending approval'));
}
setAnalyticsEnabled(false);
setLanguageChoice('en');
ReactDOM.createRoot(document.getElementById('root')).render(h(StoreProvider, null, h(Fixture)));
`;

async function until(check, description, timeout = 20_000) {
  const deadline = Date.now() + timeout;
  do {
    const value = await check();
    if (value) return value;
    await delay(100);
  } while (Date.now() < deadline);
  throw new Error(`Timed out: ${description}`);
}

test('the two approved read names qualify for an exact saved tool grant', () => {
  const config = { command: process.execPath, args: [path.join(root, 'mcp/server.mjs')] };
  for (const tool of ['list_nguon', 'view_bang_anh_nguon']) {
    const name = `mcp__review-anh__${tool}`;
    assert.equal(isReadOnlyTool(name), true);
    assert.ok(providerToolAllowKey('claude', name, config));
  }
  for (const tool of ['liet_ke_nguon', 'bang_anh_nguon', 'dung_bo_anh', 'tai_len_postiz', 'ghi_dang']) {
    assert.equal(providerToolAllowKey('claude', `mcp__review-anh__${tool}`, config), null);
  }
  assert.equal(providerToolAllowKey('claude', 'mcp__postiz__schedulePostTool', { url: 'http://127.0.0.1:1/mcp' }), null);
});

test('Postiz approvals use the real isolated broker and renderer', { timeout: 180_000 }, async t => {
  const scratch = await mkdtemp(path.join(tmpdir(), 'review-anh-approval-'));
  const evidence = path.join(root, 'ra', 'verification', `mausbot-approval-${Date.now()}`);
  await mkdir(evidence, { recursive: true });
  const callsFile = path.join(scratch, 'calls.json');
  await writeFile(callsFile, '[]');
  const fake = await startFakePostiz();
  let fixture;
  let preview;
  let browser;
  const summary = { scriptedNativeCallback: true, renderer: 'production PendingApprovalPanel/Actions and StoreProvider', fullAppTested: false, fullAppBlocker: 'OpenMausBot checkout lacks @fishaudio/agent-client', realEngineTested: false, livePostizTested: false, checks: {} };
  try {
    fixture = await launchVerificationServer({ FAKE_CLAUDE_TOOL_CALLS_FILE: callsFile, OMB_POSTIZ_CLOUD_URL: fake.url });
    assert.match(fixture.info.url, /^http:\/\/127\.0\.0\.1:\d+$/);
    const api = async (method, route, body) => {
      const response = await fetch(fixture.info.url + route, {
        method, headers: { origin: fixture.info.url, 'content-type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(15_000),
      });
      assert.ok(response.ok, `${method} ${route}: HTTP ${response.status}`);
      return response.json();
    };
    const control = args => runControlOmb([...args, '--url', fixture.info.url]);
    const messages = async bot => (await api('GET', `/api/threads/${bot.threadId}/messages?limit=100`)).messages;
    const pending = rows => rows.filter(row => row.card?.requestId && row.card.tool && !row.card.answered && !row.card.dismissed && !row.card.expired);
    const created = await api('POST', '/api/bots', { name: 'Review approval fixture' });
    const bot = created.bot;
    const other = (await api('POST', '/api/bots', { name: 'No Postiz fixture' })).bot;
    await api('PATCH', '/api/config', { language: 'en' });
    for (const row of (await api('GET', '/api/bots?messages=0')).bots) {
      await api('PATCH', `/api/bots/${row.id}`, { approvalMode: 'ask', applyToAllThreads: true, mcpServers: row.id === bot.id ? ['postiz'] : [], ...(row.defaultBot ? { welcomed: true } : {}) });
    }
    await api('PUT', '/api/config', { postiz: { url: fake.url, key: FAKE_POSTIZ_KEY } });
    assert.equal((await api('GET', '/api/postiz')).state, 'connected');
    assert.equal(fake.calls.length, 0);
    const draft = { socialPost: [{ integrationId: 'int_linkedin', date: '2026-11-17T09:00:00.000Z', type: 'draft', shortLink: false, isPremium: false, settings: [], postsAndComments: [{ content: '<p>Isolated approval fixture only.</p>' }] }] };
    // The fake CLI does not request permissions itself; script the native callback before its Postiz call.
    const scripted = [
      { server: 'ogb', name: 'approve', input: { tool_name: 'mcp__postiz__schedulePostTool', input: draft } },
      { server: 'postiz', name: 'schedulePostTool', input: draft },
    ];
    const start = async (target, calls) => {
      await writeFile(callsFile, JSON.stringify(calls));
      await rm(fixture.fixtureDumpPath, { force: true });
      const sent = await control(['send', '--bot', target.id, '--task', target.threadId, '--text', 'Exercise only the isolated approval fixture.']);
      assert.equal(sent.success, true);
    };
    const dump = () => until(async () => {
      try { return JSON.parse(await readFile(fixture.fixtureDumpPath, 'utf8')); }
      catch (error) { if (error.code !== 'ENOENT') throw error; return null; }
    }, 'fake engine launch dump');
    preview = await createServer({
      root: fileURLToPath(omb), cacheDir: path.join(scratch, 'node_modules/.vite'), logLevel: 'error',
      optimizeDeps: { entries: [], include: ['react', 'react-dom/client', 'react/jsx-dev-runtime'] },
      server: { host: '127.0.0.1', port: 0, proxy: { '/api': { target: fixture.info.url }, '/.well-known/openmausbot/environment': { target: fixture.info.url } } },
      plugins: [{
        name: 'review-approval-fixture',
        resolveId: id => id === '/__review-approval-entry.js' ? '\0review-approval-entry' : undefined,
        load: id => id === '\0review-approval-entry' ? approvalEntry : undefined,
        configureServer(server) {
          server.middlewares.use((request, response, next) => {
            if (request.url?.split('?')[0] !== '/__review-approval.html') return next();
            void server.transformIndexHtml(request.url, '<!doctype html><html><head><meta charset="utf-8"><title>Isolated review approval</title></head><body><div id="root"></div><script type="module" src="/__review-approval-entry.js"></script></body></html>')
              .then(html => { response.setHeader('content-type', 'text/html'); response.end(html); }).catch(next);
          });
        },
      }],
    });
    await preview.listen();
    const previewUrl = new URL('/__review-approval.html', preview.resolvedUrls.local[0]).href;
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 960 } });
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      return ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ? route.continue() : route.abort();
    });
    const page = await context.newPage();
    page.setDefaultTimeout(20_000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text().slice(0, 500)); });
    page.on('requestfailed', request => {
      if (request.failure()?.errorText !== 'net::ERR_ABORTED') errors.push(`${new URL(request.url()).pathname}: ${request.failure()?.errorText}`);
    });
    const pairing = await api('POST', '/api/auth/pairing', {});
    assert.equal((await context.request.post(new URL('/api/auth/pair', previewUrl).href, { data: { code: pairing.code, cookie: true, label: 'Review approval fixture' } })).status(), 200);
    const openBot = async target => {
      const url = new URL(previewUrl);
      url.searchParams.set('bot', target.id);
      url.searchParams.set('thread', target.threadId);
      await page.goto(url.href);
      await page.getByRole('heading', { name: target.name, exact: true }).waitFor({ timeout: 8_000 }).catch(async error => {
        await writeFile(path.join(evidence, 'renderer-error.txt'), `${await page.locator('body').innerText()}\n${JSON.stringify(errors)}`);
        throw new Error(`${error.message}; renderer: ${await page.locator('body').innerText()}; errors: ${JSON.stringify(errors)}`);
      });
    };
    const snapshot = async name => {
      const tree = await page.locator('body').ariaSnapshot();
      await writeFile(path.join(evidence, `${name}.txt`), tree);
      await page.screenshot({ path: path.join(evidence, `${name}.png`), fullPage: true });
      return tree;
    };

    await openBot(bot);
    await t.test('Ask holds the actual request until Allow once on the acting bot card', async () => {
      await start(bot, scripted);
      assert.equal((await control(['wait', '--bot', bot.id, '--task', bot.threadId, '--timeout', '20'])).status, 'needs-user');
      const rows = await messages(bot);
      assert.equal(pending(rows).length, 1);
      assert.equal(pending(rows)[0].card.tool, 'mcp__postiz__schedulePostTool');
      assert.equal(fake.calls.length, 0);
      await page.getByRole('button', { name: 'Allow once', exact: true }).waitFor();
      assert.match(await snapshot('ask-pending'), /button "Allow once"/);
      assert.equal(fake.calls.length, 0);
      const [response] = await Promise.all([
        page.waitForResponse(result => new URL(result.url()).pathname === `/api/threads/${bot.threadId}/respond` && result.request().method() === 'POST'),
        page.getByRole('button', { name: 'Allow once', exact: true }).click(),
      ]);
      assert.equal(response.status(), 200);
      assert.equal(response.request().postDataJSON().requestId, pending(rows)[0].card.requestId);
      assert.equal((await response.json()).outcome, 'allowed-once');
      assert.equal((await control(['wait', '--bot', bot.id, '--task', bot.threadId, '--timeout', '30'])).status, 'settled');
      assert.equal(fake.calls.length, 1);
      assert.deepEqual(fake.calls[0], { name: 'schedulePostTool', arguments: draft, authorization: `Bearer ${FAKE_POSTIZ_KEY}` });
      assert.equal(pending(await messages(bot)).length, 0);
      await until(async () => await page.getByRole('button', { name: 'Allow once', exact: true }).count() === 0, 'answered card removed');
      await snapshot('ask-approved');
      summary.checks.ask = { pendingCards: 1, callsBeforeApproval: 0, callsAfterApproval: 1, clickedOwnCard: true };
    });

    await t.test('Full runs the same callback and Postiz call without a pending card', async () => {
      await api('PATCH', `/api/bots/${bot.id}`, { approvalMode: 'full', applyToAllThreads: true });
      await openBot(bot);
      await start(bot, scripted);
      assert.equal((await control(['wait', '--bot', bot.id, '--task', bot.threadId, '--timeout', '30'])).status, 'settled');
      assert.equal(fake.calls.length, 2);
      assert.equal(pending(await messages(bot)).length, 0);
      assert.equal(await page.getByRole('button', { name: 'Allow once', exact: true }).count(), 0);
      assert.doesNotMatch(await snapshot('full-no-card'), /button "Allow once"/);
      const decisions = (await api('GET', '/api/decisions')).decisions;
      assert.ok(decisions.some(row => row.tool === 'mcp__postiz__schedulePostTool' && row.source === 'full-access'));
      summary.checks.full = { pendingCards: 0, additionalPostizCalls: 1, source: 'full-access' };
    });

    await t.test('an explicit empty server selection leaves Postiz out of another bot turn', async () => {
      const callsBefore = fake.calls.length;
      await start(other, []);
      assert.equal((await control(['wait', '--bot', other.id, '--task', other.threadId, '--timeout', '30'])).status, 'settled');
      const mounted = Object.keys((await dump()).mcpConfig.mcpServers);
      assert.equal(mounted.includes('postiz'), false);
      assert.equal(fake.calls.length, callsBefore);
      summary.checks.otherBot = { explicitSelection: [], postizMounted: false };
    });
    assert.deepEqual(errors, []);
    for (const target of [bot, other]) assert.equal(JSON.stringify(await messages(target)).includes(FAKE_POSTIZ_KEY), false);
    summary.screenshots = {};
    for (const name of ['ask-pending', 'ask-approved', 'full-no-card']) {
      summary.screenshots[`${name}.png`] = createHash('sha256').update(await readFile(path.join(evidence, `${name}.png`))).digest('hex');
    }
    await writeFile(path.join(evidence, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
    t.diagnostic(`Sanitized evidence: ${path.join(evidence, 'summary.json')}`);
  } finally {
    await browser?.close();
    await preview?.close();
    await fixture?.close();
    if (fixture) await copyFile(fixture.info.logPath, path.join(evidence, 'server.log'));
    await fake.close();
    await rm(scratch, { recursive: true, force: true });
  }
});
