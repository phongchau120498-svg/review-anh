import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, cp, link, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const runId = '2026-11-19T12-34-56-123Z-0123abcd';
const divider = '|---|---|---|---|---|---|---|';
const historyHeading = '## Đã đưa vào brand';
const moawLog = 'docs/brand/moaw/bai-hoc.md';

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'ghi-bai-hoc-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const at = (...parts) => path.join(root, ...parts);
  await mkdir(at('tools'));
  await mkdir(at('docs/brand/moaw'), { recursive: true });
  for (const name of ['brand.mjs', 'ghi-bai-hoc.mjs']) {
    await cp(new URL(name, import.meta.url), at('tools', name));
  }
  const dirs = ['body-oil', 'love-oil', 'brand-moi-serum'].map(product => at('ra', product, runId));
  await Promise.all(dirs.map(dir => mkdir(dir, { recursive: true })));
  const run = (...args) => exec(process.execPath, [at('tools/ghi-bai-hoc.mjs'), ...args])
    .then(({ stdout }) => JSON.parse(stdout), error => {
      assert.equal(error.code, 1, error.stderr);
      return JSON.parse(error.stdout);
    });
  const log = (...args) => run('body-oil', runId, ...args);
  return { at, run, log };
}

test('ghi vào cuối bảng đã có và chuẩn hóa lý do thành đúng một ô', async t => {
  const { at, log } = await fixture(t);
  await cp(new URL('../' + moawLog, import.meta.url), at(moawLog));
  const expected = await readFile(at(moawLog), 'utf8');
  const first = await log('sua', 'giong-van', 'Câu bìa | nghe như quảng cáo\nRút gọn');
  assert.equal(first.ok, true);
  assert.match(first.ma, /^BH-\d{8}-1$/);
  assert.equal(await readFile(at(moawLog), 'utf8'), expected.replace(divider,
    divider + '\n| ' + first.ma + ' | ' + first.ma.slice(3, 11).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') +
    ' | body-oil | ' + runId + ' | sua | giong-van | Câu bìa / nghe như quảng cáo Rút gọn |'));
});

test('từ chối ngày sai, lượt không tồn tại, đường dẫn sai, loại sai, lý do trống/dài và thông tin liên hệ', async t => {
  const { at, run } = await fixture(t);
  const impossibleId = '2026-02-30T12-34-56-123Z-0123abcd';
  await mkdir(at('ra/body-oil', impossibleId));
  await symlink(at('ra/body-oil', runId), at('ra/love-oil/2026-11-19T12-34-56-123Z-0123abce'));
  for (const args of [
    ['../body-oil', runId, 'sua', 'giong-van', 'Gọn hơn'],
    ['body-oil', '../' + runId, 'sua', 'giong-van', 'Gọn hơn'],
    ['body-oil', impossibleId, 'sua', 'giong-van', 'Gọn hơn'],
    ['body-oil', '2026-11-19T12-34-56-123Z-0123abce', 'sua', 'giong-van', 'Gọn hơn'],
    ['love-oil', '2026-11-19T12-34-56-123Z-0123abce', 'sua', 'giong-van', 'Gọn hơn'],
    ['body-oil', runId, 'khac', 'giong-van', 'Gọn hơn'],
    ['body-oil', runId, 'sua', 'loai-sai', 'Gọn hơn'],
    ['body-oil', runId, 'sua', 'khac', ' \n '],
    ['body-oil', runId, 'sua', 'khac', 'ễ'.repeat(301)],
    ['body-oil', runId, 'sua', 'khac', 'khach@example.invalid'],
    ['body-oil', runId, 'sua', 'khac', '090 123 4567'],
  ]) {
    assert.equal((await run(...args)).ok, false, args.slice(0, 4).join(' '));
  }
  await assert.rejects(access(at(moawLog)), { code: 'ENOENT' });
});

test('từ chối file bài học trỏ ra ngoài hoặc có hardlink', async t => {
  const { at, log } = await fixture(t);
  await writeFile(at('file-khac'), 'không sửa');
  for (const makeLink of [symlink, link]) {
    await makeLink(at('file-khac'), at(moawLog));
    assert.equal((await log('sua', 'giong-van', 'Gọn hơn')).ok, false);
    assert.equal(await readFile(at('file-khac'), 'utf8'), 'không sửa');
    await rm(at(moawLog));
  }
});

test('tạo đúng bảng theo brand và giữ đủ dòng khi nhiều tiến trình ghi cùng lúc', async t => {
  const { at, run } = await fixture(t);
  await mkdir(at('docs/brand/brand-moi'));
  const other = await run('brand-moi-serum', runId, 'duyet', 'khac', 'Duyệt bản nháp');
  assert.equal(other.ok, true);
  const newBrandLog = await readFile(at('docs/brand/brand-moi/bai-hoc.md'), 'utf8');
  assert.match(newBrandLog, /^# Bài học brand-moi\n\n\| Mã \| Ngày \| Sản phẩm \| run_id \| Kết luận \| Loại \| Lý do \|/);
  assert.match(newBrandLog, /\| brand-moi-serum \| .* \| duyet \| khac \| Duyệt bản nháp \|\n\n## Đã đưa vào brand\n$/);

  const writes = await Promise.all(Array.from({ length: 8 }, (_, i) =>
    run(i % 2 ? 'body-oil' : 'love-oil', runId, 'sua', 'giong-van', 'Góp ý ' + i)));
  assert(writes.every(result => result.ok), JSON.stringify(writes));
  const ids = writes.map(result => result.ma);
  assert.equal(new Set(ids).size, writes.length);
  const contents = await readFile(at(moawLog), 'utf8');
  assert.equal(contents.match(/^\| BH-/gm).length, writes.length);
  assert(contents.endsWith('\n\n' + historyHeading + '\n'));
  for (const [i, id] of ids.entries()) {
    assert(contents.split('\n').some(line => line.startsWith('| ' + id + ' | ') && line.endsWith('| Góp ý ' + i + ' |')));
  }
});

test('chỉ ghi mốc áp dụng cho hai lỗi cùng loại đã ghi và mục có thật', async t => {
  const { at, log, run } = await fixture(t);
  const file = 'giong-van.md';
  const section = 'Tông theo chỗ đặt chữ';
  await writeFile(at('docs/brand/moaw', file), '# Giọng văn\n\n## ' + section + '\n');
  const a = await log('sua', 'giong-van', 'Gọn hơn');
  const b = await log('bo', 'giong-van', 'Giọng bán hàng');
  const c = await log('duyet', 'giong-van', 'Giọng phù hợp');
  const d = await log('sua', 'chon-anh', 'Đổi góc ảnh');
  const mark = (ids, name = file, heading = section) =>
    run('--da-dua-vao-brand', 'body-oil', ids.join(','), name, heading);
  for (const args of [
    [[a.ma]],
    [[a.ma, a.ma]],
    [[a.ma, 'BH-20261119-1000']],
    [[a.ma, c.ma]],
    [[a.ma, d.ma]],
    [[a.ma, b.ma], '../' + file],
    [[a.ma, b.ma], file, 'Mục không có'],
  ]) assert.equal((await mark(...args)).ok, false);
  const before = await readFile(at(moawLog), 'utf8');
  assert.deepEqual(await mark([a.ma, b.ma]), { ok: true, ma: [a.ma, b.ma] });
  assert.equal((await mark([a.ma, b.ma])).ok, false);
  const after = await readFile(at(moawLog), 'utf8');
  assert(after.startsWith(before));
  assert.match(after.slice(before.length), new RegExp(
    '^\\n- ' + a.ma + ', ' + b.ma + ' → giong-van\\.md mục "' + section + '" \\(\\d{4}-\\d{2}-\\d{2}, người dùng duyệt\\)\\n$'));
  assert.equal((await log('sua', 'bo-cuc', 'Chữ đè sản phẩm')).ok, true);
  assert((await readFile(at(moawLog), 'utf8')).endsWith(after.slice(before.indexOf('\n\n' + historyHeading))));
});
