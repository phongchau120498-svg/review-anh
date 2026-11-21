import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dang } from './dang-postiz.mjs';

const repo = fileURLToPath(new URL('..', import.meta.url));
const logFile = path.join(repo, 'ra', '.postiz-dang', 'nhat-ky.jsonl');

// Postiz giả: kiểm key, nhận ảnh, ghi lại body tạo bài.
async function fakePostiz() {
  const seen = { uploads: 0, post: null };
  const server = createServer(async (req, res) => {
    if (req.headers.authorization !== 'khoa-thu') { res.writeHead(401).end('{}'); return; }
    let body = '';
    for await (const c of req) body += c;
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/api/public/v1/integrations') return res.end(JSON.stringify([{ id: 'tt1', identifier: 'tiktok', disabled: false }]));
    if (req.url === '/api/public/v1/upload') { seen.uploads++; return res.end(JSON.stringify({ id: `m${seen.uploads}`, path: `http://x/uploads/${seen.uploads}.jpg` })); }
    if (req.url === '/api/public/v1/posts') { seen.post = JSON.parse(body); return res.end(JSON.stringify([{ postId: 'p1', integration: 'tt1' }])); }
    res.writeHead(404).end('{}');
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  return { seen, url: `http://127.0.0.1:${server.address().port}/api`, close: () => server.close() };
}

async function makeRun(parent, name, kiem) {
  const run = path.join(parent, name);
  await mkdir(run, { recursive: true });
  const anh = kiem.map((_, i) => path.relative(repo, path.join(run, `0${i + 1}.jpg`)));
  for (const a of anh) await writeFile(path.join(repo, a), 'jpg');
  await writeFile(path.join(run, 'manifest.json'), JSON.stringify({ anh, kiem: kiem.map(dat => ({ dat })) }));
  return path.relative(repo, run);
}

test('đưa run đã kiểm vào nháp TikTok; chặn run lỗi, đưa trùng, key sai', async t => {
  const fake = await fakePostiz();
  const before = await readFile(logFile, 'utf8').catch(() => null);
  const sp = await mkdtemp(path.join(repo, 'ra', 'test-dang-'));
  const hidden = await mkdtemp(path.join(repo, 'ra', '_test-dang-'));
  t.after(async () => {
    fake.close();
    await rm(sp, { recursive: true, force: true });
    await rm(hidden, { recursive: true, force: true });
    if (before === null) await rm(logFile, { force: true }); else await writeFile(logFile, before);
  });
  const env = { POSTIZ_API_KEY: 'khoa-thu', POSTIZ_URL: fake.url };

  const good = await makeRun(sp, 'r1', [true, true]);
  const r = await dang([good, '--caption', 'Thử caption', '--tieu-de', 'Tiêu đề'], env);
  assert.deepEqual(r, { ok: true, post_id: 'p1', run: good, so_anh: 2, che_do: 'nhap-inbox-tiktok' });
  assert.equal(fake.seen.uploads, 2);
  const p = fake.seen.post.posts[0];
  assert.equal(p.settings.content_posting_method, 'UPLOAD');
  assert.equal(p.integration.id, 'tt1');
  assert.deepEqual(p.value[0].image.map(i => i.id), ['m1', 'm2']);

  await assert.rejects(dang([good, '--caption', 'lại'], env), /đã đưa lên rồi/);
  await assert.rejects(dang([await makeRun(sp, 'r2', [true, false]), '--caption', 'x'], env), /chưa kiểm đạt/);
  await assert.rejects(dang([await makeRun(sp, 'r3', [true]), '--caption', 'x'], { ...env, POSTIZ_API_KEY: 'sai' }), /từ chối API key/);
  await assert.rejects(dang([await makeRun(hidden, 'r1', [true]), '--caption', 'x'], env), /ra\/<san-pham>\/<run_id>/);
  await assert.rejects(dang(['tools', '--caption', 'x'], env), /ra\/<san-pham>\/<run_id>/);
  await assert.rejects(dang([good], env), /Thiếu --caption/);
  assert.equal(fake.seen.uploads, 2, 'run bị chặn không được tải ảnh lên');
});
