import path from 'node:path';
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { camList } from './brand.mjs';
import { ROOT, readBoundedFile, readBrief, safePath, validateCopy } from './dung-bo-anh.mjs';

const normalize = value => value.normalize('NFC').toLowerCase()
  .replace(/(?<=\p{L})[._*]+(?=\p{L})/gu, '').replace(/\s+/gu, ' ').trim();
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const words = value => value.trim() ? value.trim().split(/\s+/u).length : 0;
const usage = 'Dùng: node tools/soat-chu.mjs [--ban-hang] nguon/<sp>/bo-anh.json [--caption ra/<sp>/<run_id>/_xem/caption.json]';

export async function soatChu({ data, caption, product = data.san_pham, traiNghiem = true, root = ROOT }) {
  const brief = traiNghiem ? undefined : await readBrief(product);
  const banned = camList(product, root).map(cum => ({
    cum, pattern: new RegExp(`(?<![\\p{L}\\p{N}])${escape(normalize(cum))}(?![\\p{L}\\p{N}])`, 'u'),
  }));
  const loi = [];
  const canh_bao = [];
  function checkCopy(copy, cho, trich) {
    try {
      validateCopy(copy, brief);
    } catch {
      loi.push({ loai: 'gia-link', cho, trich });
    }
  }
  function checkText(trich, cho, gioi_han, count = words) {
    if (trich === undefined) return;
    if (typeof trich !== 'string') throw new Error(`${cho}: cần chuỗi`);
    const normalized = normalize(trich);
    for (const { cum, pattern } of banned) {
      if (pattern.test(normalized)) loi.push({ loai: 'cum-cam', cho, trich, cum });
    }
    checkCopy({ anh: [{ tieu_de: traiNghiem ? trich.normalize('NFC') : trich }] }, cho, trich);
    const thuc_te = count(trich);
    if (thuc_te > gioi_han) canh_bao.push({ loai: 'do-dai', cho, gioi_han, thuc_te });
  }

  for (const cho of ['gia', 'link']) {
    if (data[cho] !== undefined) checkCopy({ anh: [], [cho]: data[cho] }, cho, String(data[cho]));
  }
  for (const [i, slide] of data.anh.entries()) {
    const cho = `anh[${i}]`;
    checkText(slide.tieu_de, `${cho}.tieu_de`, slide.mau === 'bia' ? 12 : 10);
    checkText(slide.phu, `${cho}.phu`, 10);
    for (const [j, value] of (slide.y ?? []).entries()) checkText(value, `${cho}.y[${j}]`, 14);
  }
  checkText(caption?.threads, 'caption.threads', 500, value => [...value].length);
  checkText(caption?.tiktok, 'caption.tiktok', 90, value => value.length);
  return { dat: !loi.length, loi, canh_bao };
}

async function readCaption(file, product) {
  const absolute = path.resolve(ROOT, file);
  const [area, code, run, folder, name, ...extra] = path.relative(ROOT, absolute).split('/');
  if (area !== 'ra' || code !== product || !/^\d{4}(?:-\d{2}){2}T\d{2}(?:-\d{2}){2}-\d{3}Z-[a-f0-9]{8}$/.test(run) ||
      folder !== '_xem' || name !== 'caption.json' || extra.length) throw new Error(usage);
  const manifestPath = path.resolve(path.dirname(absolute), '..', 'manifest.json');
  const preview = 'ra/' + product + '/' + run + '/_xem/bang-ket-qua.jpg';
  const previewPath = path.resolve(ROOT, preview);
  for (const input of [absolute, manifestPath, previewPath]) {
    if (await safePath(input, 'ra') !== input) throw new Error('Lượt dựng và caption không được dùng symlink');
  }
  const manifest = JSON.parse(await readBoundedFile(manifestPath, 100000, 'manifest.json', { singleLink: true }));
  if (manifest?.san_pham !== product || manifest.run_id !== run || manifest.bang_xem !== preview ||
      !Array.isArray(manifest.anh) || !manifest.anh.length || !(await stat(previewPath)).isFile()) {
    throw new Error('Caption cần thuộc đúng lượt dựng của sản phẩm');
  }
  const caption = JSON.parse(await readBoundedFile(absolute, 100000, 'caption.json', { singleLink: true }));
  if (!caption || Object.keys(caption).length !== 2 ||
      ![caption.threads, caption.tiktok].every(value => typeof value === 'string' && value.trim() && !value.includes('\0'))) {
    throw new Error('caption.json cần đúng hai chuỗi threads và tiktok');
  }
  return caption;
}

async function main(args) {
  const traiNghiem = args[0] !== '--ban-hang';
  const [file, ...extra] = traiNghiem ? args : args.slice(1);
  const absolute = path.resolve(ROOT, file ?? '');
  const product = /^nguon\/([a-z0-9-]+)\/bo-anh\.json$/.exec(path.relative(ROOT, absolute))?.[1];
  if (!product || (extra.length && (extra.length !== 2 || extra[0] !== '--caption' || !extra[1]))) throw new Error(usage);
  const input = await safePath(absolute, 'nguon');
  if (input !== absolute) throw new Error('bo-anh.json không được là symlink');
  const data = JSON.parse(await readBoundedFile(input, 100000, 'bo-anh.json'));
  if (data?.san_pham !== product || !Array.isArray(data.anh) || !data.anh.length) {
    throw new Error('Bộ ảnh cần đúng sản phẩm và có ảnh');
  }
  const caption = extra.length ? await readCaption(extra[1], product) : undefined;
  const report = await soatChu({ data, caption, product, traiNghiem });
  console.log(JSON.stringify(report));
  process.exitCode = report.dat ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(error => {
    console.log(JSON.stringify({ loi: error.message }));
    process.exitCode = 2;
  });
}
