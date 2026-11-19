import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, rm, symlink, mkdtemp, readdir, truncate, copyFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import { ROOT, normalizeProduct, safePath, readBrief, validateCopy, checkImages, createPreview, fillPage, renderSet } from './dung-bo-anh.mjs';

const exec = promisify(execFile);
const product = `kiem-${process.pid}`;
const source = path.join(ROOT, 'nguon', product);
const output = path.join(ROOT, 'ra', product);
const brief = { ten: 'Sản phẩm MẪU', diem_noi_bat: ['MẪU một', 'MẪU hai', 'MẪU ba'], gia: 'MẪU: 123.000 đ', link: 'https://example.com/mau', domains_thuong_hieu: ['example.com'] };
const set = title => ({ san_pham: product, anh: [{ mau: 'bia', nguon: `nguon/${product}/-anh.jpg`, tieu_de: title, phu: 'MẪU: ỗ ự ẫ, chữ tiếng Việt' }] });
let outside;
let browser;
let result;

before(async () => {
  await mkdir(source, { recursive: true });
  await mkdir(output, { recursive: true });
  outside = await mkdtemp(path.join(os.tmpdir(), 'review-anh-'));
  await writeFile(path.join(source, 'brief.json'), JSON.stringify(brief));
  await exec('magick', ['-size', '1080x1920', 'xc:#abc2aa', '-strip', path.join(source, '-anh.jpg')]);
  await exec('magick', ['-size', '1080x1920', 'xc:#ddd4bb', '-strip', path.join(source, 'anh.png')]);
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  await rm(source, { recursive: true, force: true });
  await rm(output, { recursive: true, force: true });
  await rm(outside, { recursive: true, force: true });
});

test('chuẩn hóa NFC, bỏ dấu và traversal; từ chối tên rỗng', () => {
  assert.equal(normalizeProduct('../../x'), 'x');
  assert.equal(normalizeProduct('Đồ Dưỡng Ẩm'), 'do-duong-am');
  assert.equal(normalizeProduct('Đồ Dưỡng Ẩm'.normalize('NFD')), 'do-duong-am');
  assert.throws(() => normalizeProduct('../../'), /không tạo được/);
});

test('realpath chặn traversal, prefix gần giống, symlink nguồn/đích và tiền tố đích chưa tồn tại', async () => {
  await symlink(outside, path.join(source, 'thoat'));
  await symlink(outside, path.join(output, 'thoat'));
  await assert.rejects(safePath('nguon-xau/file.jpg', 'nguon'), /phải nằm/);
  await assert.rejects(safePath('nguon/../../etc/passwd', 'nguon'), /phải nằm/);
  await assert.rejects(safePath(path.join(source, 'thoat'), 'nguon'), /Symlink/);
  await assert.rejects(safePath(path.join(output, 'thoat/moi/file.jpg'), 'ra', { allowMissing: true }), /Symlink/);
  assert.equal(await safePath(path.join(output, 'moi/file.jpg'), 'ra', { allowMissing: true }), path.join(output, 'moi/file.jpg'));
});

test('brief và copy bắt buộc đúng giá/link/domain, cả giá được ghi trong chữ', async () => {
  assert.deepEqual(await readBrief(product), brief);
  assert.throws(() => validateCopy({ ...set('MẪU'), gia: 123000 }, brief), /gia không khớp/);
  assert.throws(() => validateCopy({ ...set('MẪU'), link: 'https://evil.example/' }, brief), /link không khớp/);
  assert.throws(() => validateCopy(set('Giá MẪU: 23.000 đ'), brief), /Giá trong chữ/);
  assert.throws(() => validateCopy(set('Giá MẪU: 999k'), brief), /Giá trong chữ/);
  assert.throws(() => validateCopy(set('Giá MẪU: 999 000 đ'), { ...brief, gia: 'MẪU: 123 000 đ' }), /Giá trong chữ/);
  assert.throws(() => validateCopy(set('Chỉ 999.000 đồng'), brief), /Giá trong chữ/);
  assert.throws(() => validateCopy(set('Chỉ 999.000\u00a0ĐỒNG'), brief), /Giá trong chữ/);
  assert.doesNotThrow(() => validateCopy(set('Chỉ 123.000 ĐỒNG'), { ...brief, gia: '123.000 ĐỒNG' }));
  assert.throws(() => validateCopy(set('Xem https://example.com/khac'), brief), /Link trong chữ/);
  assert.throws(() => validateCopy(set('Mua ở evil.example/mau'), brief), /Link trong chữ/);
  assert.throws(() => validateCopy(set('Mua ở evil.example.'), brief), /Link trong chữ/);
  assert.doesNotThrow(() => validateCopy(set(`MẪU ${brief.gia} ${brief.link}`), brief));
  assert.doesNotThrow(() => validateCopy(set('Chai màu vàng')));
  assert.throws(() => validateCopy(set(`Giá ${brief.gia}`)), /Giá trong chữ/);
  assert.throws(() => validateCopy(set(`Xem ${brief.link}`)), /Link trong chữ/);
  await assert.rejects(renderSet({ ...set('MẪU'), gia: brief.gia }, { browser, traiNghiem: true }), /gia không khớp/);
  assert.doesNotThrow(() => validateCopy(set(`Mua ngay: (${brief.link}). Xem anh.jpg và phẩm.mẫu`), brief));
  const punctuatedLink = 'https://example.com/mau_(a)?ma=999k.';
  assert.doesNotThrow(() => validateCopy(set(`“${punctuatedLink}”`), { ...brief, link: punctuatedLink }));
  assert.throws(() => validateCopy(set(punctuatedLink.slice(0, -1)), { ...brief, link: punctuatedLink }), /Link trong chữ/);
  await writeFile(path.join(source, 'brief.json'), JSON.stringify({ ...brief, domains_thuong_hieu: ['other.example'] }));
  await assert.rejects(readBrief(product), /ngoài domain/);
  await writeFile(path.join(source, 'brief.json'), JSON.stringify({ ...brief, gia: 123 }));
  await assert.rejects(readBrief(product), /brief.gia/);
  await writeFile(path.join(source, 'brief.json'), JSON.stringify(brief));
});

test('120 ký tự, dấu Việt và iframe hiện nguyên văn; font nhúng, không tràn vùng an toàn', async () => {
  const context = await browser.newContext({ viewport: { width: 1080, height: 1920 }, javaScriptEnabled: false, serviceWorkers: 'block' });
  try {
    const page = await context.newPage();
    const imageData = `data:image/jpeg;base64,${(await readFile(path.join(source, '-anh.jpg'))).toString('base64')}`;
    const title = 'ỗ ự ẫ '.repeat(20); // Đúng 120 ký tự.
    assert.equal(title.length, 120);
    for (const slide of [set(title).anh[0], { mau: 'chi-tiet', tieu_de: title, y: [title, title] }, set('<iframe src="file:///etc/passwd">').anh[0]]) {
      const layout = await fillPage(page, slide, imageData);
      assert.equal(await page.locator('h1').textContent(), slide.tieu_de);
      assert.equal(await page.locator('iframe').count(), 0);
      assert(layout.every(box => box.x >= 0 && box.y >= 220 && box.x + box.width <= 910 && box.y + box.height <= 1400));
    }
    await fillPage(page, set('ỗ ự ẫ').anh[0], imageData);
    const cdp = await context.newCDPSession(page);
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument');
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: 'h1' });
    const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
    assert(fonts.length > 0 && fonts.every(font => font.isCustomFont && font.familyName === 'Be Vietnam Pro'), JSON.stringify(fonts));
    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
    assert.equal(csp, "default-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline'");
    await page.addScriptTag({ content: 'document.body.dataset.ran="yes"' }).catch(() => {});
    assert.equal(await page.locator('body').getAttribute('data-ran'), null);
    await assert.rejects(fillPage(page, { mau: 'chi-tiet', tieu_de: 'MẪU', y: ['Chữ rất dài '.repeat(150), 'Chữ rất dài '.repeat(150)] }, imageData), /Chữ quá dài/);
    await assert.rejects(page.goto('https://example.com/'), /ERR_FAILED/);
    await assert.rejects(page.goto('file:///etc/passwd'), /ERR_FAILED/);
  } finally { await context.close(); }
});

test('dựng JPEG/PNG, tên bắt đầu bằng -, manifest đúng ảnh đăng và bảng xem riêng', async () => {
  const data = set('MẪU chữ tiếng Việt ỗ ự ẫ');
  data.anh.push({ mau: 'chi-tiet', nguon: `nguon/${product}/anh.png`, tieu_de: 'Chi tiết MẪU', y: ['MẪU một', 'MẪU hai'] });
  const observedBrowser = { isConnected: () => browser.isConnected(), newContext: options => {
    assert.equal(options.javaScriptEnabled, false);
    assert.equal(options.serviceWorkers, 'block');
    assert.deepEqual(options.viewport, { width: 1080, height: 1920 });
    return browser.newContext(options);
  } };
  result = await renderSet(data, { browser: observedBrowser });
  assert(result.kiem.every(check => check.dat));
  assert.equal(result.anh.length, 2);
  assert(result.bang_xem.includes('/_xem/'));
  assert(result.anh.every(file => !file.includes('_xem')));
  const manifest = JSON.parse(await readFile(path.join(ROOT, result.manifest), 'utf8'));
  assert.deepEqual(manifest.anh, result.anh);
  assert.deepEqual(manifest.kiem, result.kiem);
  for (const check of manifest.kiem) {
    assert.equal(check.sha256, createHash('sha256').update(await readFile(path.join(ROOT, check.path))).digest('hex'));
  }
  assert.deepEqual((await readdir(path.join(ROOT, result.thu_muc))).sort(), ['01.jpg', '02.jpg', '_xem', 'manifest.json']);
  assert(!(await readdir(output)).some(name => name.startsWith('.tam-')));
  assert.equal(await createPreview(result.anh), result.bang_xem);
});

test('từ chối input sai và SVG đội tên .jpg; lỗi dựng dọn thư mục tạm', async () => {
  await assert.rejects(renderSet({ ...set('MẪU'), anh: [] }, { browser }), /1–20/);
  await assert.rejects(renderSet({ ...set('MẪU'), caption: 'ngoài schema' }, { browser }), /không được hỗ trợ/);
  await assert.rejects(renderSet({ ...set('MẪU'), anh: [{ ...set('MẪU').anh[0], mau: 'cta' }] }, { browser }), /mau phải/);
  await writeFile(path.join(source, 'gia.jpg'), '<svg xmlns="http://www.w3.org/2000/svg"><image href="file:///etc/passwd"/></svg>');
  await assert.rejects(renderSet({ ...set('MẪU'), anh: [{ ...set('MẪU').anh[0], nguon: `nguon/${product}/gia.jpg` }] }, { browser }), /insufficient image|improper image|Not a JPEG/i);
  assert(!(await readdir(output)).some(name => name.startsWith('.tam-')));
});

test('kiem duyệt hết từng ảnh, báo format/kích thước/metadata/8MB/20MB rồi mã lỗi chung; cwd độc lập', async () => {
  const ok = path.join(ROOT, result.anh[0]);
  const png = path.join(output, 'sai.png');
  const meta = path.join(output, 'metadata.jpg');
  const big = path.join(output, 'to.jpg');
  const truncated = path.join(output, 'anh-cat.jpg');
  const jpeg = await readFile(ok);
  await writeFile(truncated, jpeg.subarray(0, Math.floor(jpeg.length / 2)));
  await exec('magick', ['-size', '10x20', 'xc:white', png]);
  await exec('magick', [ok, '-set', 'comment', 'metadata test', meta]);
  await copyFile(ok, big);
  await truncate(big, 8000001);
  let checks = await checkImages([png, meta, big, 'ra/khong-co.jpg', truncated, result.anh[0]]);
  assert.equal(checks.length, 6);
  assert(checks[0].loi.some(error => error.includes('JPEG')));
  assert(checks[0].loi.some(error => error.includes('1080x1920')));
  assert(checks[1].loi.some(error => error.includes('metadata')));
  assert(checks[2].loi.some(error => error.includes('8 MB')));
  assert.equal(checks[3].dat, false);
  assert.equal(checks[4].dat, false);
  assert.match(checks[4].loi.join(' '), /premature end|corrupt JPEG/i);
  assert.equal(checks[5].dat, true);
  await truncate(big, 20000000);
  checks = await checkImages([big]);
  assert(checks[0].loi.some(error => error.includes('20 MB')));
  const processResult = await exec('bash', [path.join(ROOT, 'tools/tiktok-anh.sh'), 'kiem', png, 'ra/khong-co.jpg', result.anh[0]], { cwd: os.tmpdir() }).then(() => null, error => error);
  assert.equal(processResult.code, 1);
  assert(processResult.stdout.includes('sai.png') && processResult.stdout.includes('khong-co.jpg') && processResult.stdout.includes(`Đạt: ${result.anh[0]}`));
  const preview = await exec('bash', [path.join(ROOT, 'tools/tiktok-anh.sh'), 'luoi', ...result.anh], { cwd: os.tmpdir() });
  assert(preview.stdout.includes('/_xem/bang-ket-qua.jpg'));
  await writeFile(path.join(source, 'bo-anh.json'), JSON.stringify(set('MẪU chạy từ /tmp')));
  const cli = await exec(process.execPath, [path.join(ROOT, 'tools/dung-bo-anh.mjs'), `nguon/${product}/bo-anh.json`], { cwd: os.tmpdir() });
  assert(JSON.parse(cli.stdout).kiem.every(check => check.dat));
});

test('chu từ thư mục con theo cwd cũ và chỉ in đúng đường dẫn ra trên stdout', async () => {
  const outputName = path.relative(source, path.join(output, 'chu.jpg'));
  const command = await exec('bash', [path.join(ROOT, 'tools/tiktok-anh.sh'), 'chu', './-anh.jpg', outputName, 'MẪU tiếng Việt'], {
    cwd: source, env: { ...process.env, TIKTOK_ANH_FONT: path.join(ROOT, 'fonts/BeVietnamPro-Bold.ttf') },
  });
  assert.equal(command.stdout, `${outputName}\n`);
  assert.equal(command.stderr, '');
  assert((await checkImages([path.join(output, 'chu.jpg')]))[0].dat);
});
