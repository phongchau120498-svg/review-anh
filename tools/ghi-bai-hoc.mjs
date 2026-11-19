import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, open, realpath, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { brandOf } from './brand.mjs';

const log = 'bai-hoc.md';
const columns = '| Mã | Ngày | Sản phẩm | run_id | Kết luận | Loại | Lý do |';
const divider = '|---|---|---|---|---|---|---|';
const historyHeading = '\n\n## Đã đưa vào brand\n';
const outcomes = new Set(['duyet', 'sua', 'bo']);
const types = new Set(['giong-van', 'cau-cam', 'claim', 'chon-anh', 'chinh-ta', 'bo-cuc', 'khac']);
const runPattern = /^(\d{4}(?:-\d{2}){2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z-[a-f0-9]{8}$/;
const usage = 'Dùng: node tools/ghi-bai-hoc.mjs <sp> <run_id> <duyet|sua|bo> <loai> "<lý do>" hoặc --da-dua-vao-brand <sp> <ma1,ma2> <file> "<mục>"';

function requireThat(value, message) {
  if (!value) throw new Error(message);
}

function oneLine(value) {
  const line = value.replaceAll('|', '/').replace(/\s+/gu, ' ').trim();
  requireThat(line && [...value].length <= 300 && !/\p{Cc}/u.test(line),
    'Lý do hoặc tên mục cần có nội dung và tối đa 300 ký tự');
  // shortcut: chỉ nhận diện thông tin liên hệ dễ thấy, người ghi phải bỏ tên và dữ liệu khách trước khi chạy.
  requireThat(!/@|https?:\/\/|www\.|\d(?:[ .()+-]*\d){6}/iu.test(line),
    'Bỏ thông tin liên hệ hoặc dữ liệu cá nhân trước khi ghi');
  return line;
}

function plainMarkdown(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replace(/[\\`[\]*_~]/g, '\\$&');
}

async function readRegular(file, allowMissing = false) {
  const handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK).catch(error => {
    if (!allowMissing || error.code !== 'ENOENT') throw error;
  });
  if (!handle) return;
  try {
    const info = await handle.stat();
    requireThat(info.isFile() && info.nlink === 1, 'File bài học hoặc file brand không an toàn');
    return { content: await handle.readFile('utf8'), mode: info.mode & 0o777 };
  } finally { await handle.close(); }
}

function splitLog(content) {
  const [table, history, extra] = content.split(historyHeading);
  const [title, blank, header, separator, ...rows] = table.split('\n');
  requireThat(history !== undefined && extra === undefined && title.startsWith('# Bài học ') &&
    blank === '' && header === columns && separator === divider &&
    rows.every(row => /^\| BH-\d{8}-[1-9]\d* \| (?:[^|]+ \| ){5}[^|]+ \|$/.test(row)),
    'Bảng bài học sai khuôn');
  return { table, history, rows };
}

async function addLesson(root, product, args, { table, history, rows }, date) {
  const [run, outcome, type, reason] = args;
  requireThat(args.length === 4, usage);
  const iso = run.replace(runPattern, '$1T$2:$3:$4.$5Z');
  const stamp = Date.parse(iso);
  requireThat(runPattern.test(run) && Number.isFinite(stamp) && new Date(stamp).toISOString() === iso,
    'run_id không hợp lệ');
  const evidence = path.join(root, 'ra', product, run);
  const info = await lstat(evidence).catch(error => {
    if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error;
  });
  requireThat(info?.isDirectory() && await realpath(evidence) === evidence,
    'Không có thư mục lượt dựng an toàn trong ra/<sp>/<run_id>/');
  requireThat(outcomes.has(outcome) && types.has(type), 'Kết luận hoặc loại bài học không hợp lệ');
  const text = plainMarkdown(oneLine(reason));

  const prefix = 'BH-' + date.replaceAll('-', '') + '-';
  const ma = prefix + (rows.filter(row => row.startsWith('| ' + prefix)).length + 1);
  const entry = '| ' + [ma, date, product, run, outcome, type, text].join(' | ') + ' |';
  return { ma, content: table + '\n' + entry + historyHeading + history };
}

async function markApplied(args, parsed, date) {
  const [list, file, section] = args;
  requireThat(args.length === 3 && /^[a-z0-9][a-z0-9-]*\.(?:md|txt)$/.test(file) &&
    !file.startsWith('bai-hoc') && file === file.trim(), usage);
  const heading = oneLine(section);
  const { content: brandText } = await readRegular(file);
  requireThat([...brandText.matchAll(/^#{1,6}[ \t]+(.+?)\s*$/gm)].some(match => match[1] === heading),
    'Mục đã sửa chưa có trong file brand');

  const { table, history, rows } = parsed;
  const used = new Set([...history.matchAll(/^- (.+?) → /gm)].flatMap(match => match[1].split(', ')));
  const ids = list.split(',');
  requireThat(ids.every(id => /^BH-\d{8}-[1-9]\d*$/.test(id) && id === id.trim()), 'Mã bài học không hợp lệ');
  const lessons = ids.map(id => rows.find(row => row.startsWith('| ' + id + ' | '))?.split(' | '));
  requireThat(ids.length >= 2 && new Set(ids).size === ids.length && lessons.every((lesson, index) =>
    lesson && !used.has(ids[index]) && ['sua', 'bo'].includes(lesson[4]) && lesson[5] === lessons[0][5]),
    'Cần ít nhất hai mã bài học cùng loại chưa đưa vào brand');

  const entry = '- ' + ids.join(', ') + ' → ' + file + ' mục "' + plainMarkdown(heading) + '" (' + date + ', người dùng duyệt)\n';
  const gap = history && history.endsWith('\n') ? '' : '\n';
  return { ma: ids, content: table + historyHeading + history + gap + entry };
}

async function main(args) {
  const applied = args[0] === '--da-dua-vao-brand';
  const [product, ...values] = applied ? args.slice(1) : args;
  requireThat(product && product.length <= 100 && product === product.trim() && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product), usage);
  const root = await realpath(fileURLToPath(new URL('..', import.meta.url)));
  const brand = brandOf(product, root);
  const dir = path.join(root, 'docs/brand', brand);

  // Ghim thư mục để đổi tên nguyên tử và giữ khóa trên cùng inode suốt lượt ghi.
  process.chdir(dir);
  requireThat(process.cwd() === dir, 'Thư mục brand không an toàn');
  const lock = await open('.', constants.O_RDONLY | constants.O_DIRECTORY);
  try {
    const result = spawnSync('flock', ['-w', '10', '3'], { stdio: ['ignore', 'ignore', 'ignore', lock.fd] });
    requireThat(result.status === 0, 'Không khóa được bảng bài học');
    const title = brand === 'moaw' ? 'Moaw Moaws' : brand;
    const current = await readRegular(log, true);
    const parsed = splitLog(current?.content ?? '# Bài học ' + title + '\n\n' + columns + '\n' + divider + historyHeading);
    const date = new Date().toISOString().slice(0, 10);
    const { ma, content } = applied ? await markApplied(values, parsed, date) :
      await addLesson(root, product, values, parsed, date);
    const temp = '.bai-hoc.' + randomUUID() + '.tmp';
    try {
      await writeFile(temp, content, { flag: 'wx', mode: current?.mode ?? 0o644 });
      await rename(temp, log);
    } finally { await rm(temp, { force: true }); }
    return ma;
  } finally { await lock.close(); }
}

try {
  const ma = await main(process.argv.slice(2));
  console.log(JSON.stringify({ ok: true, ma }));
} catch (error) {
  console.log(JSON.stringify({ ok: false, loi: error.code ? 'Không đọc hoặc ghi được bài học' : error.message }));
  process.exitCode = 1;
}
