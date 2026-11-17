import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { chromium } from 'playwright';
import { launchVerificationServer, runControlOmb } from '../../OpenMausBot/scripts/control-omb.ts';
import { startFakePostiz, FAKE_POSTIZ_KEY } from '../../OpenMausBot/server/testing/fake-postiz.ts';
import { ROOT } from '../tools/dung-bo-anh.mjs';

const exec = promisify(execFile);

test('MausBot cô lập gọi thật render/upload, Postiz giả và bot ngoài lựa chọn không mount hai server', { timeout: 120000 }, async () => {
  const scratch = await mkdtemp(path.join(os.tmpdir(), 'review-mausbot-'));
  const product = `omb-${process.pid}`;
  const source = path.join(ROOT, 'nguon', product);
  const output = path.join(ROOT, 'ra', product);
  const callsFile = path.join(scratch, 'tool-calls.json');
  const key = `fixture-upload-canary-${process.pid}`;
  const uploads = [];
  const summaries = [];
  const apiAnswers = [];
  let fixture, postiz, upload;
  try {
    await mkdir(source, { recursive: true });
    await mkdir(output, { recursive: true });
    await writeFile(path.join(source, 'brief.json'), JSON.stringify({ ten: 'MẪU fixture', diem_noi_bat: ['MẪU một', 'MẪU hai', 'MẪU ba'], gia: '123.000 đ', link: 'https://example.com/mau', domains_thuong_hieu: ['example.com'] }));
    await exec('magick', ['-size', '1080x1920', 'xc:#bbd5cb', '-strip', path.join(source, '-anh.jpg')]);
    await writeFile(callsFile, '[]');
    postiz = await startFakePostiz();
    upload = createServer(async (request, response) => {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      uploads.push({ path: request.url, authorization: request.headers.authorization, body: Buffer.concat(chunks) });
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify({ id: 'fixture-image-1', path: 'https://example.com/fixture-image-1.jpg' }));
    });
    await new Promise(resolve => upload.listen(0, '127.0.0.1', resolve));
    fixture = await launchVerificationServer({ ...process.env, FAKE_CLAUDE_TOOL_CALLS_FILE: callsFile, OMB_TEST_PORTS: '19820-19839' });
    const api = async (method, route, data, expected = 200) => {
      assert(/^http:\/\/127\.0\.0\.1:\d+$/.test(fixture.info.url));
      const response = await fetch(fixture.info.url + route, { method, headers: { 'content-type': 'application/json' }, redirect: 'error',
        ...(data === undefined ? {} : { body: JSON.stringify(data) }), signal: AbortSignal.timeout(40000) });
      const text = await response.text();
      apiAnswers.push(text);
      assert.equal(response.status, expected, `${method} ${route}: ${text}`);
      return text ? JSON.parse(text) : null;
    };
    const control = args => runControlOmb([...args, '--url', fixture.info.url]);
    const turn = async (bot, calls) => {
      await writeFile(callsFile, JSON.stringify(calls));
      await rm(fixture.fixtureDumpPath, { force: true });
      await control(['send', '--bot', bot.id, '--text', 'Kiểm kỹ thuật sản phẩm MẪU; không đăng bài.']);
      const waited = await control(['wait', '--bot', bot.id, '--timeout', '60']);
      assert.equal(waited.status, 'settled', JSON.stringify(waited));
      const dump = JSON.parse(await readFile(fixture.fixtureDumpPath, 'utf8'));
      const messages = await api('GET', `/api/threads/${bot.threadId}/messages?limit=50`);
      return { dump, messages: JSON.stringify(messages) };
    };
    const bot = (await api('POST', '/api/bots', { name: 'Review fixture' }, 201)).bot;
    const sibling = (await api('POST', '/api/bots', { name: 'Excluded fixture' }, 201)).bot;
    for (const created of [bot, sibling]) await api('PATCH', `/api/bots/${created.id}`, { approvalMode: 'ask', mcpServers: created.id === bot.id ? ['review-anh', 'postiz'] : [] });
    await api('POST', '/api/mcp/servers', {
      name: 'review-anh', command: process.execPath, args: [path.join(ROOT, 'mcp/server.mjs')], env: {
        PATH: `${path.dirname(process.execPath)}:/usr/local/bin:/usr/bin:/bin`,
        PLAYWRIGHT_BROWSERS_PATH: path.dirname(path.dirname(path.dirname(chromium.executablePath()))),
        POSTIZ_URL: `http://127.0.0.1:${upload.address().port}/api`, POSTIZ_API_KEY: key,
      },
    }, 201);
    const tested = await api('POST', '/api/mcp/servers/review-anh/test', {});
    assert(tested.ok, JSON.stringify(tested));
    assert.deepEqual(tested.tools.map(tool => tool.name), ['list_nguon', 'view_bang_anh_nguon', 'dung_bo_anh', 'tai_len_postiz', 'ghi_dang']);
    await api('PATCH', '/api/mcp/servers/review-anh', { enabled: true });
    await api('PUT', '/api/config', { postiz: { url: postiz.url, key: FAKE_POSTIZ_KEY } });
    const rendered = await turn(bot, [{ server: 'review-anh', name: 'dung_bo_anh', input: {
      san_pham: product, anh: [{ mau: 'bia', nguon: `nguon/${product}/-anh.jpg`, tieu_de: 'MẪU từ MCP', phu: '123.000 đ' }],
    } }]);
    assert(rendered.dump.mcpConfig.mcpServers['review-anh']);
    assert(rendered.dump.mcpConfig.mcpServers.postiz);
    assert(rendered.messages.includes('manifest.json'), rendered.messages.slice(0, 3000));
    const runs = (await readdir(output)).filter(name => /^20/.test(name));
    assert.equal(runs.length, 1);
    const manifest = JSON.parse(await readFile(path.join(output, runs[0], 'manifest.json'), 'utf8'));
    assert(manifest.kiem.every(check => check.dat));
    summaries.push({ tool: 'dung_bo_anh', ok: true, images: manifest.anh.length, dimensions: '1080x1920', thumbnail: rendered.messages.includes('image') });
    const uploadCall = { server: 'review-anh', name: 'tai_len_postiz', input: { san_pham: product, run_id: runs[0], kenh: 'threads', caption: 'MẪU 123.000 đ https://example.com/mau' } };
    const uploaded = await turn(bot, [uploadCall]);
    assert(uploaded.messages.includes('fixture-image-1'));
    assert.equal(uploads.length, 1);
    assert.equal(uploads[0].path, '/api/public/v1/upload');
    assert.equal(uploads[0].authorization, key);
    assert(uploads[0].body.includes(await readFile(path.join(ROOT, manifest.anh[0]))));
    await turn(bot, [uploadCall]);
    assert.equal(uploads.length, 1);
    summaries.push({ tool: 'tai_len_postiz', ok: true, uploadCalls: 1, repeatUploadCalls: 0 });
    const other = await turn(sibling, []);
    assert(!other.dump.mcpConfig.mcpServers['review-anh']);
    assert(!other.dump.mcpConfig.mcpServers.postiz);
    assert.equal(postiz.calls.length, 0);
    summaries.push({ excludedBot: true, reviewMounted: false, postizMounted: false, realPosts: 0 });
    const log = await readFile(fixture.info.logPath, 'utf8');
    for (const secret of [key, FAKE_POSTIZ_KEY]) {
      assert(!apiAnswers.join('').includes(secret));
      assert(!rendered.messages.includes(secret));
      assert(!uploaded.messages.includes(secret));
      assert(!log.includes(secret));
    }
    await writeFile(path.join(output, 'verification-summary.json'), `${JSON.stringify({ source: 'OpenMausBot isolated fixture', engine: 'scripted fake Claude; no account credentials', summaries, secretsInAnswersOrLog: false }, null, 2)}\n`);
    console.log(JSON.stringify({ fixture: 'isolated', render: true, upload: true, idempotent: true, excludedBot: true, secretsInAnswersOrLog: false }));
  } finally {
    await fixture?.close();
    await postiz?.close();
    if (upload) { upload.closeAllConnections(); await new Promise(resolve => upload.close(resolve)); }
    await rm(source, { recursive: true, force: true });
    // Giữ tóm tắt/ảnh chứng cứ ở ra/ (gitignored); không chép config hay log fixture có credentials.
    await rm(scratch, { recursive: true, force: true });
  }
});
