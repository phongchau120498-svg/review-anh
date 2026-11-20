import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { hash } from 'node:crypto';
import { cp, link, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ROOT } from './dung-bo-anh.mjs';
import { brandDir, brandDocs, brandOf, camList } from './brand.mjs';
import { soatChu } from './soat-chu.mjs';

const draft = tieu_de => ({ san_pham: 'body-oil', anh: [{ mau: 'bia', tieu_de }] });

test('brand mặc định, tiền tố dài nhất và danh sách cấm chung lẫn riêng', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'review-brand-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const dir of ['chung', 'moaw', 'bot', 'bot-hoa']) {
    await mkdir(path.join(root, 'docs/brand', dir), { recursive: true });
  }
  await writeFile(path.join(root, 'docs/brand/chung/cam.txt'), '# Ghi chú\n chung \r\n\n');
  await writeFile(path.join(root, 'docs/brand/bot-hoa/cam.txt'), 'chung\nriêng\n');
  assert.equal(brandOf('body-oil', root), 'moaw');
  assert.equal(brandOf('chung-bo', root), 'moaw');
  assert.equal(brandOf('bot-hoa-bo', root), 'bot-hoa');
  assert.equal(brandOf('bot-hoang-bo', root), 'bot');
  assert.equal(brandOf('boto-bo', root), 'moaw');
  assert.equal(brandDir('bot-hoa-bo', root), path.join(root, 'docs/brand/bot-hoa'));
  assert.deepEqual(brandDocs('bot-hoa-bo', root), ['docs/brand/chung/cach-nghi-content.md',
    'docs/brand/bot-hoa/thuong-hieu.md', 'docs/brand/bot-hoa/giong-van.md']);
  assert.deepEqual(camList('bot-hoa-bo', root), ['chung', 'riêng']);
  assert.deepEqual(camList('bot-hoang-bo', root), ['chung']);
  await rm(path.join(root, 'docs/brand/chung/cam.txt'));
  assert.deepEqual(camList('body-oil', root), []);
});

test('phát hiện cụm cấm tại đúng trường, kể cả NFC, hoa và dấu xen', async () => {
  const title = 'TRỊ VIÊM'.normalize('NFD');
  const data = draft(title);
  data.anh[0].phu = 'quá tuyệt vời!';
  data.anh.push({ mau: 'chi-tiet', tieu_de: 'Cách dùng', y: ['Dùng thôi', 'trị viê.m'] });
  const report = await soatChu({ data, caption: { threads: 'trị viê_*m', tiktok: 'TRỊ VIÊM!' } });
  assert.deepEqual(report, { dat: false, canh_bao: [], loi: [
    { loai: 'cum-cam', cho: 'anh[0].tieu_de', trich: title, cum: 'trị viêm' },
    { loai: 'cum-cam', cho: 'anh[0].phu', trich: 'quá tuyệt vời!', cum: 'tuyệt vời' },
    { loai: 'cum-cam', cho: 'anh[1].y[1]', trich: 'trị viê.m', cum: 'trị viêm' },
    { loai: 'cum-cam', cho: 'caption.threads', trich: 'trị viê_*m', cum: 'trị viêm' },
    { loai: 'cum-cam', cho: 'caption.tiktok', trich: 'TRỊ VIÊM!', cum: 'trị viêm' },
  ] });
});

test('không bắt giữa chữ và số hoặc các câu giống một phần cụm cấm', async () => {
  const data = draft('thông thoáng lcl, không chịu nổi mùi này');
  data.anh[0].phu = 'trắng sáng';
  const caption = { threads: 'Giá trị viêm2 hay 1trị viêm hoặc atrị viêm và trị viêmz' };
  assert.deepEqual(await soatChu({ data, caption }), { dat: true, loi: [], canh_bao: [] });
});

test('giá và link trải nghiệm bị chặn trong chữ, caption và trường riêng', async () => {
  const data = { ...draft('Giá 129 nghìn'), link: 'https://example.com/', gia: 129000 };
  data.anh[0].phu = 'Xem example.com/mau';
  const caption = { threads: 'Chỉ 129.000 đồng'.normalize('NFD'), tiktok: 'https://example.com/' };
  const { dat, loi } = await soatChu({ data, caption });
  assert.equal(dat, false);
  assert.deepEqual(loi.map(({ loai, cho }) => [loai, cho]), [
    'gia', 'link', 'anh[0].tieu_de', 'anh[0].phu', 'caption.threads', 'caption.tiktok',
  ].map(cho => ['gia-link', cho]));
});

test('ngưỡng từ, code point của Threads và UTF-16 của TikTok chỉ cảnh báo', async () => {
  const words = count => Array(count).fill('ảnh').join(' \t');
  const data = draft(words(12));
  data.anh[0].phu = words(10);
  data.anh.push({ mau: 'chi-tiet', tieu_de: words(10), y: [words(14)] });
  const caption = { threads: '🍑'.repeat(500), tiktok: '🍑'.repeat(45) };
  assert.deepEqual(await soatChu({ data, caption }), { dat: true, loi: [], canh_bao: [] });
  data.anh[0].tieu_de += ' ảnh';
  data.anh[0].phu += ' ảnh';
  data.anh[1].tieu_de += ' ảnh';
  data.anh[1].y[0] += ' ảnh';
  caption.threads += '🍑';
  caption.tiktok += 'a';
  const { dat, loi, canh_bao } = await soatChu({ data, caption });
  assert.equal(dat, true);
  assert.deepEqual(loi, []);
  assert.deepEqual(canh_bao, [
    ['anh[0].tieu_de', 12], ['anh[0].phu', 10], ['anh[1].tieu_de', 10], ['anh[1].y[0]', 14],
    ['caption.threads', 500], ['caption.tiktok', 90],
  ].map(([cho, gioi_han]) => ({ loai: 'do-dai', cho, gioi_han, thuc_te: gioi_han + 1 })));
});

test('CLI trả JSON và exit 0, 1, 2; chế độ bán hàng kiểm đúng brief', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'review-chu-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = name => path.join(root, name);
  await mkdir(file('nguon/body-oil'), { recursive: true });
  await mkdir(file('tools'));
  await mkdir(file('docs'));
  await cp(path.join(ROOT, 'docs/brand'), file('docs/brand'), { recursive: true });
  for (const name of ['brand.mjs', 'soat-chu.mjs', 'dung-bo-anh.mjs']) {
    await cp(path.join(ROOT, 'tools', name), file(`tools/${name}`));
  }
  await symlink(path.join(ROOT, 'node_modules'), file('node_modules'), 'dir');
  const input = 'nguon/body-oil/bo-anh.json';
  const write = title => writeFile(file(input), JSON.stringify(draft(title)));
  const run = (...args) => {
    const result = spawnSync(process.execPath, ['tools/soat-chu.mjs', ...args], { cwd: root, encoding: 'utf8' });
    assert.ifError(result.error);
    assert.equal(result.stderr, '');
    return [result.status, JSON.parse(result.stdout)];
  };
  await write('ảnh '.repeat(13));
  const [ok, warnings] = run(input);
  assert.equal(ok, 0);
  assert.equal(warnings.dat, true);
  assert.equal(warnings.canh_bao.length, 1);
  await write('trị viê.m');
  assert.equal(run(input)[0], 1);
  assert.equal(run()[0], 2);
  assert.equal(run('--bad', input)[0], 2);
  assert.equal(run('nguon/body-oil/brief.json')[0], 2);
  await writeFile(file('nguon/body-oil/brief.json'), JSON.stringify({ ten: 'Test', gia: '129.000 đồng',
    link: 'https://example.com/mau', domains_thuong_hieu: ['example.com'], diem_noi_bat: ['a', 'b', 'c'] }));
  await write('129.000 đồng, https://example.com/mau');
  assert.equal(run(input)[0], 1);
  assert.deepEqual(run('--ban-hang', input), [0, { dat: true, loi: [], canh_bao: [] }]);
  await write('129.000 đồng, https://example.com/khac');
  assert.equal(run('--ban-hang', input)[0], 1);

  await write('Ảnh ví dụ');
  const runId = '2026-11-19T12-00-00-000Z-abcdef01';
  const output = 'ra/body-oil/' + runId;
  const preview = output + '/_xem/bang-ket-qua.jpg';
  const captionPath = output + '/_xem/caption.json';
  const check = (...args) => run(...args, input, '--caption', captionPath);
  const writeCaption = caption => writeFile(file(captionPath), JSON.stringify(caption));
  await mkdir(file(output + '/_xem'), { recursive: true });
  await writeCaption({ threads: 'Trị viê.m với giá: 199.000', tiktok: '₫199.000' });
  assert.equal(check()[0], 2);
  const manifestPath = file(output + '/manifest.json');
  const manifest = { san_pham: 'body-oil', run_id: runId, bang_xem: preview, anh: [output + '/01.jpg'] };
  await writeFile(manifestPath, JSON.stringify({ ...manifest, san_pham: 'other' }));
  const previewText = 'Ảnh xem thử';
  await writeFile(file(preview), previewText);
  assert.equal(check()[0], 2);
  await writeFile(manifestPath, JSON.stringify(manifest));
  const [status, report] = check();
  assert.equal(status, 1);
  assert.deepEqual(report.loi.map(({ cho, loai }) => [cho, loai]), [
    ['caption.threads', 'cum-cam'], ['caption.threads', 'gia-link'], ['caption.tiktok', 'gia-link'],
  ]);
  await writeCaption({ threads: 'Giá: 129.000 đồng, https://example.com/mau', tiktok: 'Ảnh mẫu' });
  assert.equal(check()[0], 1);
  assert.equal(check('--ban-hang')[0], 0);
  assert.equal(run(input, '--caption', captionPath.replace('/body-oil/', '/other/'))[0], 2);
  assert.equal(run(input, '--caption')[0], 2);
  await writeCaption({ threads: 'Ảnh mẫu', tiktok: '🍑'.repeat(46) });
  assert.deepEqual(check(), [0, { dat: true, loi: [],
    canh_bao: [{ loai: 'do-dai', cho: 'caption.tiktok', gioi_han: 90, thuc_te: 92 }] }]);
  for (const caption of [{ threads: 'Ảnh mẫu' }, { threads: 'Ảnh mẫu', tiktok: 7 },
    { threads: 'Ảnh mẫu', tiktok: 'Ảnh mẫu', extra: true }, { threads: 'x'.repeat(100001), tiktok: 'Ảnh mẫu' }]) {
    await writeCaption(caption);
    assert.equal(check()[0], 2);
  }
  await rm(file(captionPath));
  const elsewhere = output + '/_xem/elsewhere.json';
  await writeFile(file(elsewhere), JSON.stringify({ threads: 'Ảnh mẫu', tiktok: 'Ảnh mẫu' }));
  await symlink(file(elsewhere), file(captionPath));
  assert.equal(check()[0], 2);
  await rm(file(captionPath));
  await link(file(elsewhere), file(captionPath));
  assert.equal(check()[0], 2);

  await rm(file(captionPath));
  await writeCaption({ threads: 'Ảnh mẫu', tiktok: 'Ảnh mẫu' });
  const snapshot = output + '/_xem/bo-anh.json';
  const snapshotText = JSON.stringify(draft('129.000 đồng, https://example.com/mau'));
  const checksums = text => ({ ban_nhap_sha256: hash('sha256', text), bang_xem_sha256: hash('sha256', previewText) });
  const writeManifest = (ban_nhap, text = snapshotText) => writeFile(manifestPath, JSON.stringify({
    ...manifest, ban_nhap, ...(ban_nhap === undefined ? {} : checksums(text)),
  }));
  const checkSnapshot = (...args) => run(...args, snapshot, '--caption', captionPath);
  const otherRun = '2026-11-19T12-00-00-000Z-abcdef02';
  const otherOutput = 'ra/body-oil/' + otherRun;
  const otherSnapshot = otherOutput + '/_xem/bo-anh.json';
  const otherPreview = otherOutput + '/_xem/bang-ket-qua.jpg';
  const otherText = JSON.stringify(draft('Ảnh mẫu'));
  await mkdir(file(otherOutput + '/_xem'), { recursive: true });
  await writeFile(file(otherSnapshot), otherText);
  await writeFile(file(otherPreview), previewText);
  await writeFile(file(otherOutput + '/manifest.json'), JSON.stringify({
    ...manifest, run_id: otherRun, bang_xem: otherPreview, anh: [otherOutput + '/01.jpg'], ban_nhap: otherSnapshot, ...checksums(otherText),
  }));
  await writeFile(file(snapshot), snapshotText);

  assert.equal(checkSnapshot()[0], 2);
  await writeFile(manifestPath, JSON.stringify({ ...manifest, ban_nhap: snapshot }));
  assert.equal(checkSnapshot()[0], 2);
  await writeManifest(snapshot);
  assert.equal(checkSnapshot()[0], 1);
  assert.equal(checkSnapshot('--ban-hang')[0], 0);
  assert.equal(run(snapshot)[0], 1);
  assert.equal(run(otherSnapshot)[0], 0);
  assert.equal(run(otherSnapshot, '--caption', captionPath)[0], 2);
  for (const path of [otherSnapshot, input, file(snapshot), output + '/_xem/../_xem/bo-anh.json', null]) {
    await writeManifest(path);
    assert.equal(check()[0], 2);
  }

  await writeManifest(snapshot);
  await rm(file(preview));
  await link(file(otherPreview), file(preview));
  assert.equal(check()[0], 2);
  await writeManifest(undefined);
  assert.equal(check()[0], 0);
  await writeManifest(snapshot);
  await rm(file(preview));
  await writeFile(file(preview), previewText);

  await rm(file(snapshot));
  assert.equal(check()[0], 2);
  await mkdir(file(snapshot));
  assert.equal(check()[0], 2);
  await rm(file(snapshot), { recursive: true });
  await symlink(file(otherSnapshot), file(snapshot));
  assert.equal(check()[0], 2);
  await rm(file(snapshot));
  await link(file(otherSnapshot), file(snapshot));
  assert.equal(check()[0], 2);
  await rm(file(snapshot));
  await writeFile(file(snapshot), otherText);
  assert.match(check()[1].loi, /Bản nháp đã đổi/);
  const wrongProduct = JSON.stringify({ ...draft('Ảnh mẫu'), san_pham: 'other' });
  await writeFile(file(snapshot), wrongProduct);
  await writeManifest(snapshot, wrongProduct);
  assert.equal(check()[0], 2);
});
