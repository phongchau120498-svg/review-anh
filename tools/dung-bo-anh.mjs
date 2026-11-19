#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { constants, open, realpath, readFile, writeFile, mkdir, mkdtemp, rename, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { chromium } from 'playwright';

export const ROOT = await realpath(path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
export const MAX_POST_IMAGE_BYTES = 8000000;
const exec = promisify(execFile);
const inside = (base, file) => {
  const relative = path.relative(base, file);
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
};
const relative = file => path.relative(ROOT, file).split(path.sep).join('/');
const text = (value, label, max = 1000) => {
  if (typeof value !== 'string' || !value.trim() || value.length > max || value.includes('\0')) {
    throw new Error(`${label}: cần chuỗi có nội dung, tối đa ${max} ký tự`);
  }
  return value;
};

export function normalizeProduct(value) {
  text(value, 'san_pham', 100);
  const slug = value.normalize('NFC').toLowerCase().replaceAll('đ', 'd').normalize('NFD')
    .replace(/\p{M}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!slug) throw new Error('san_pham: không tạo được tên [a-z0-9-]');
  return slug;
}

// Kiểm cả tiền tố chưa tồn tại để không mkdir qua một symlink ra ngoài.
export async function safePath(value, area, { allowMissing = false } = {}) {
  text(value, 'Đường dẫn', 4096);
  if (!['nguon', 'ra'].includes(area)) throw new Error('Vùng đường dẫn không hợp lệ');
  const base = path.join(ROOT, area);
  if (await realpath(base) !== base) throw new Error(`${area}/ không được là symlink`);
  const target = path.resolve(ROOT, value);
  if (!inside(base, target)) throw new Error(`Đường dẫn phải nằm trong ${area}/`);
  let existing = target;
  const missing = [];
  for (;;) {
    try {
      const resolved = await realpath(existing);
      if (!inside(base, resolved)) throw new Error(`Symlink ra ngoài ${area}/`);
      return path.join(resolved, ...missing);
    } catch (error) {
      if (error.code !== 'ENOENT' || !allowMissing || existing === base) throw error;
      missing.unshift(path.basename(existing));
      existing = path.dirname(existing);
    }
  }
}

async function mediaPath(value) {
  const absolute = path.resolve(ROOT, value);
  return safePath(value, inside(path.join(ROOT, 'nguon'), absolute) ? 'nguon' : 'ra');
}

export async function readBoundedFile(file, maxBytes, label) {
  // Mở nonblocking để FIFO đổi vào giữa realpath và open không giữ tool vô hạn.
  const handle = await open(file, constants.O_RDONLY | constants.O_NONBLOCK | constants.O_NOFOLLOW);
  try {
    const info = await handle.stat();
    if (!info.isFile()) throw new Error(`${label}: cần file thường`);
    const { size } = info;
    if (size > maxBytes) throw new Error(`${label}: tối đa ${maxBytes} byte`);
    const bytes = Buffer.allocUnsafe(size + 1);
    let offset = 0;
    while (offset < bytes.length) {
      const { bytesRead } = await handle.read(bytes, offset, bytes.length - offset, offset);
      if (!bytesRead) break;
      offset += bytesRead;
    }
    if (offset !== size) throw new Error(`${label}: kích thước file vừa thay đổi`);
    return bytes.subarray(0, size);
  } finally { await handle.close(); }
}

export async function readBrief(product) {
  const slug = normalizeProduct(product);
  const file = await safePath(`nguon/${slug}/brief.json`, 'nguon');
  const brief = JSON.parse(await readBoundedFile(file, 100000, 'brief.json'));
  text(brief.ten, 'brief.ten', 200);
  text(brief.gia, 'brief.gia', 200);
  text(brief.link, 'brief.link', 1000);
  if (!Array.isArray(brief.diem_noi_bat) || brief.diem_noi_bat.length !== 3) {
    throw new Error('brief.diem_noi_bat: cần đúng 3 ý');
  }
  brief.diem_noi_bat.forEach(value => text(value, 'brief.diem_noi_bat', 500));
  if (!Array.isArray(brief.domains_thuong_hieu) || !brief.domains_thuong_hieu.length ||
      brief.domains_thuong_hieu.some(domain => typeof domain !== 'string' ||
        !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(domain))) {
    throw new Error('brief.domains_thuong_hieu: cần danh sách hostname');
  }
  const url = new URL(brief.link);
  if (url.protocol !== 'https:' || url.username || url.password ||
      !brief.domains_thuong_hieu.includes(url.hostname)) throw new Error('brief.link ngoài domain thương hiệu hoặc không phải HTTPS');
  return brief;
}

export function validateCopy(data, brief = {}) {
  for (const key of ['gia', 'link']) {
    if (data[key] !== undefined && data[key] !== brief[key]) throw new Error(`${key} không khớp nguyên văn brief`);
  }
  const copy = data.anh.flatMap(slide => [slide.tieu_de, slide.phu, ...(slide.y ?? [])]).filter(Boolean).join('\n');
  // shortcut: hostname trần dùng ASCII; tên miền quốc tế cần URL đầy đủ, mở rộng nếu brief thật cần.
  const links = /(?<![\p{L}\p{M}\p{N}_-])(?:https?:\/\/[^\s<>"]+|(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}(?![\p{L}\p{M}\p{N}_-])(?::\d+)?(?:[/?#][^\s<>"]*)?)/giu;
  const withoutLinks = copy.replace(links, url => {
    if (!/^www\./i.test(url) && /^(?:[^:/?#]+)\.(?:jpe?g|png|heic|webp)$/i.test(url)) return url;
    if (brief.link && url.startsWith(brief.link) && /^[.,!?;:…'’”»\)\]}]*$/u.test(url.slice(brief.link.length))) return ' ';
    throw new Error('Link trong chữ không khớp nguyên văn brief');
  });
  // shortcut: chỉ nhận giá có đơn vị, mở rộng khi brief thật cần cách ghi khác.
  const money = /\b\d+(?:[., \u00a0\u202f]\d+)*[ \t\u00a0\u202f]*(?:đồng|₫|đ|vnđ|vnd|k|nghìn|triệu)(?![\p{L}\p{M}\p{N}])/giu;
  const allowed = brief.gia?.match(money) ?? [];
  for (const price of withoutLinks.match(money) ?? []) {
    if (!allowed.includes(price)) throw new Error('Giá trong chữ không khớp nguyên văn brief');
  }
}

async function command(args, input) {
  const pending = exec('magick', args, { cwd: ROOT, timeout: 15000, maxBuffer: 32 * 1024 * 1024 });
  if (input) {
    pending.child.stdin.on('error', () => {});
    pending.child.stdin.end(input);
  }
  return pending;
}

function rasterInput(file, input = file) {
  const format = { '.jpg': 'jpeg', '.jpeg': 'jpeg', '.png': 'png', '.heic': 'heic', '.webp': 'webp' }[path.extname(file).toLowerCase()];
  if (!format) throw new Error('Nguồn phải là ảnh JPEG/PNG/HEIC/WebP');
  return `${format}:${input}`;
}

export async function checkImages(paths) {
  const results = [];
  for (const value of paths) {
    const errors = [];
    let bytes;
    let sha256;
    try {
      const file = await mediaPath(value);
      const info = await stat(file);
      if (!info.isFile()) throw new Error('Không phải file ảnh');
      bytes = info.size;
      if (bytes >= 20000000) errors.push('TikTok: phải dưới 20 MB');
      if (bytes > MAX_POST_IMAGE_BYTES) errors.push('Threads: tối đa 8 MB');
      if (!errors.length) {
        const input = await readBoundedFile(file, MAX_POST_IMAGE_BYTES, 'Ảnh đăng');
        bytes = input.length;
        const raster = rasterInput(file, '-');
        const { stdout } = await command(['identify', '-regard-warnings', '-limit', 'width', '4096', '-limit', 'height', '4096',
          '-format', '%m|%w|%h|%[colorspace]|%c', '--', raster], input);
        const [format, width, height, colorspace, ...comment] = stdout.split('|');
        // ImageMagick 7 cảnh báo property profiles chưa có trên JPEG đã strip.
        const { stdout: profiles } = await command(['identify', '-ping', '-format', '%[profiles]', '--', raster], input);
        if (format !== 'JPEG') errors.push('Threads: cần JPEG');
        if (width !== '1080' || height !== '1920') errors.push('TikTok: cần 1080x1920');
        if (colorspace !== 'sRGB') errors.push('TikTok: cần sRGB');
        if (profiles.trim() || comment.join('|').trim()) errors.push('Còn metadata/profile/comment');
        if (!errors.length) sha256 = createHash('sha256').update(input).digest('hex');
      }
    } catch (error) {
      errors.push(error.message);
    }
    results.push({ path: value, dat: errors.length === 0, bytes, loi: errors, ...(sha256 ? { sha256 } : {}) });
  }
  return results;
}

export async function createPreview(paths) {
  if (!paths.length) throw new Error('Cần ít nhất một ảnh cho bảng xem');
  const files = await Promise.all(paths.map(file => safePath(file, 'ra')));
  const checks = await checkImages(files);
  if (checks.some(check => !check.dat)) throw new Error('Bảng xem chỉ nhận ảnh đã qua kiem');
  if (files.some(file => path.dirname(file) !== path.dirname(files[0]))) throw new Error('Bảng xem cần các ảnh cùng thư mục');
  const folder = await safePath(path.join(path.dirname(files[0]), '_xem'), 'ra', { allowMissing: true });
  await mkdir(folder, { recursive: true });
  const output = await safePath(path.join(folder, 'bang-ket-qua.jpg'), 'ra', { allowMissing: true });
  await command(['montage', '--', ...files.map(file => rasterInput(file)), '-geometry', '270x480+8+8', '-background', '#e8e4db', '-tile', `${files.length}x1`, '-strip', '-quality', '85', output]);
  return relative(output);
}

let assets;
async function loadAssets() {
  if (!assets) {
    const css = await readFile(path.join(ROOT, 'mau/chung.css'), 'utf8');
    const regular = (await readFile(path.join(ROOT, 'fonts/BeVietnamPro-Regular.ttf'))).toString('base64');
    const bold = (await readFile(path.join(ROOT, 'fonts/BeVietnamPro-Bold.ttf'))).toString('base64');
    assets = css.replace('/*FONT_REGULAR*/', `data:font/ttf;base64,${regular}`)
      .replace('/*FONT_BOLD*/', `data:font/ttf;base64,${bold}`);
  }
  return assets;
}

export async function fillPage(page, slide, imageData) {
  if (!['bia', 'chi-tiet'].includes(slide.mau)) throw new Error('mau phải là bia hoặc chi-tiet');
  const template = await readFile(path.join(ROOT, `mau/${slide.mau}.html`), 'utf8');
  await page.route('**/*', route => route.abort());
  await page.setContent(template.replace('/*CHUNG_CSS*/', await loadAssets()), { waitUntil: 'load' });
  return page.evaluate(async ({ slide, imageData }) => {
    document.querySelector('img').src = imageData;
    document.querySelector('.tieu-de').textContent = slide.tieu_de;
    if (slide.mau === 'bia') document.querySelector('.phu').textContent = slide.phu ?? '';
    else {
      const list = document.querySelector('.y');
      for (const value of slide.y) {
        const item = document.createElement('li');
        item.textContent = value;
        list.append(item);
      }
    }
    await document.fonts.ready;
    await document.querySelector('img').decode();
    const layout = [];
    for (const element of document.querySelectorAll('.tieu-de,.phu,.y')) {
      let size = parseFloat(getComputedStyle(element).fontSize);
      while ((element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth) && size > 24) {
        size -= 1;
        element.style.fontSize = `${size}px`;
      }
      if (element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth) throw new Error('Chữ quá dài, không vừa vùng an toàn');
      const box = element.getBoundingClientRect();
      if (box.left < 0 || box.top < 220 || box.right > 910 || box.bottom > 1400) throw new Error('Chữ ra ngoài vùng an toàn');
      layout.push({ text: element.textContent, size, x: box.x, y: box.y, width: box.width, height: box.height });
    }
    return layout;
  }, { slide, imageData });
}

export async function renderSet(data, { browser, timeoutMs = 60000, traiNghiem = false } = {}) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Bộ ảnh phải là object');
  if (Object.keys(data).some(key => !['san_pham', 'anh', 'gia', 'link'].includes(key))) throw new Error('Trường bộ ảnh không được hỗ trợ');
  const product = normalizeProduct(data.san_pham);
  if (!Array.isArray(data.anh) || data.anh.length < 1 || data.anh.length > 20) throw new Error('Cần 1–20 ảnh');
  const brief = traiNghiem ? {} : await readBrief(product);
  const sourceFolder = await safePath(`nguon/${product}`, 'nguon');
  const slides = [];
  for (const slide of data.anh) {
    if (!slide || !['bia', 'chi-tiet'].includes(slide.mau)) throw new Error('mau phải là bia hoặc chi-tiet');
    if (Object.keys(slide).some(key => !['mau', 'nguon', 'tieu_de', 'phu', 'y'].includes(key))) throw new Error('Trường ảnh không được hỗ trợ');
    text(slide.tieu_de, 'tieu_de', 500);
    if (slide.phu !== undefined) text(slide.phu, 'phu', 1000);
    if (slide.mau === 'chi-tiet') {
      if (!Array.isArray(slide.y) || slide.y.length < 2 || slide.y.length > 3) throw new Error('chi-tiet cần 2–3 ý');
      slide.y.forEach(value => text(value, 'y', 500));
    } else if (slide.y !== undefined) throw new Error('bia không dùng y');
    text(slide.nguon, 'nguon', 4096);
    const file = await safePath(slide.nguon, 'nguon');
    if (!inside(sourceFolder, file)) throw new Error('Ảnh phải thuộc đúng thư mục sản phẩm');
    if (!/\.(jpe?g|png|heic|webp)$/i.test(file) || !(await stat(file)).isFile()) throw new Error('Nguồn phải là ảnh JPEG/PNG/HEIC/WebP');
    slides.push({ ...slide, file });
  }
  validateCopy(data, brief);
  await mkdir(path.join(ROOT, 'ra'), { recursive: true });
  const destination = await safePath(`ra/${product}`, 'ra', { allowMissing: true });
  await mkdir(destination, { recursive: true });
  const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`;
  const final = await safePath(path.join(destination, runId), 'ra', { allowMissing: true });
  const temporary = await mkdtemp(path.join(destination, '.tam-'));
  const ownBrowser = !browser?.isConnected();
  let context;
  let timer;
  try {
    if (ownBrowser) browser = await chromium.launch({ timeout: 30000 });
    context = await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1, javaScriptEnabled: false, serviceWorkers: 'block' });
    context.setDefaultTimeout(Math.min(timeoutMs, 15000));
    timer = setTimeout(() => context.close().catch(() => {}), timeoutMs);
    const page = await context.newPage();
    const images = [];
    for (const [index, slide] of slides.entries()) {
      const { stdout } = await exec('magick', ['--', rasterInput(slide.file), '-auto-orient', '-resize', '1080x1920>', '-colorspace', 'sRGB', '-strip', 'jpeg:-'], {
        cwd: ROOT, encoding: 'buffer', timeout: 15000, maxBuffer: 32 * 1024 * 1024,
      });
      await fillPage(page, slide, `data:image/jpeg;base64,${stdout.toString('base64')}`);
      const file = await safePath(path.join(temporary, `${String(index + 1).padStart(2, '0')}.jpg`), 'ra', { allowMissing: true });
      const screenshot = await page.screenshot({ type: 'jpeg', quality: 94, timeout: 15000 });
      await writeFile(file, screenshot);
      await command(['--', rasterInput(file), '-colorspace', 'sRGB', '-strip', '-sampling-factor', '4:2:0', '-quality', '92', file]);
      images.push(relative(file));
    }
    const checks = await checkImages(images);
    if (checks.some(check => !check.dat)) throw new Error(`Ảnh không đạt: ${JSON.stringify(checks)}`);
    const preview = await createPreview(images);
    const movePath = file => relative(path.join(final, path.relative(temporary, path.resolve(ROOT, file))));
    const manifest = { san_pham: product, run_id: runId, anh: images.map(movePath),
      brief: { ten: brief.ten, gia: brief.gia, link: brief.link },
      kiem: checks.map(check => ({ ...check, path: movePath(check.path) })), bang_xem: movePath(preview) };
    await writeFile(await safePath(path.join(temporary, 'manifest.json'), 'ra', { allowMissing: true }), `${JSON.stringify(manifest, null, 2)}\n`);
    await rename(temporary, final);
    return { ...manifest, thu_muc: relative(final), manifest: relative(path.join(final, 'manifest.json')) };
  } finally {
    clearTimeout(timer);
    await context?.close().catch(() => {});
    if (ownBrowser) await browser?.close().catch(() => {});
    await rm(temporary, { recursive: true, force: true });
  }
}

async function main(args) {
  const [mode, ...files] = args;
  if (mode === '--kiem') {
    if (!files.length) throw new Error('kiem cần ít nhất một ảnh');
    const results = await checkImages(files);
    for (const result of results) console.log(`${result.dat ? 'Đạt' : 'Lỗi'}: ${result.path}${result.loi.length ? ` — ${result.loi.join('; ')}` : ''}`);
    process.exitCode = results.some(result => !result.dat) ? 1 : 0;
  } else if (mode === '--luoi') console.log(path.join(ROOT, await createPreview(files)));
  else {
    const traiNghiem = mode === '--trai-nghiem';
    const [draft, ...extra] = traiNghiem ? files : args;
    if (!draft || extra.length) throw new Error('Dùng: node tools/dung-bo-anh.mjs [--trai-nghiem] nguon/<sp>/bo-anh.json');
    const input = await mediaPath(draft);
    if ((await stat(input)).size > 100000) throw new Error('JSON bộ ảnh tối đa 100 KB');
    console.log(JSON.stringify(await renderSet(JSON.parse(await readFile(input, 'utf8')), { traiNghiem }), null, 2));
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
