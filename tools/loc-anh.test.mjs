import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, copyFile, cp, link, mkdir, mkdtemp, readFile, readdir, rm, stat, symlink, utimes, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { locAnh } from './loc-anh.mjs';

const exec = promisify(execFile);
const root = fileURLToPath(new URL('..', import.meta.url));

async function fixture(t, names) {
  const folder = await mkdtemp(path.join(os.tmpdir(), 'loc-anh-'));
  t.after(() => rm(folder, { recursive: true, force: true }));
  await mkdir(path.join(folder, 'tools'));
  for (const name of names) await cp(path.join(root, 'tools', name), path.join(folder, 'tools', name));
  return folder;
}

test('lọc ảnh tối, mờ và khung gần trùng giữ ảnh nét nhất; cập nhật cache theo mtime và size', async t => {
  const folder = await fixture(t, ['loc-anh.mjs', 'bang-nguon.sh']);
  const source = path.join(folder, 'nguon/bo-test');
  const image = name => path.join(source, name + '.PNG');
  const cache = path.join(source, '.cham-anh.json');
  await mkdir(source, { recursive: true });
  await exec('magick', ['-size', '512x512', 'xc:#efddd5', '-fill', '#42332d',
    '-draw', 'rectangle 75,85 260,430 rectangle 310,47 360,350', '-fill', '#b47e19',
    '-draw', 'circle 135,125 170,210', image('net')]);
  await exec('magick', [image('net'), '-roll', '+2+1', '-blur', '0x0.35', image('gan trung')]);
  await exec('magick', [image('net'), '-blur', '0x20', image('mo')]);
  await exec('magick', [image('net'), '-evaluate', 'multiply', '0.1', image('toi')]);
  await symlink(image('net'), image('lien-ket'));
  const score = async () => Object.fromEntries((await locAnh(source)).map(photo => [photo.ten, photo]));
  const initial = await score();
  assert.equal(initial['toi.PNG'].loai, 'toi');
  assert.equal(initial['mo.PNG'].loai, 'mo');
  assert.equal(initial['gan trung.PNG'].loai, 'gan-trung');
  assert.equal(initial['gan trung.PNG'].giu, 'net.PNG');
  assert(initial['net.PNG'].net > initial['gan trung.PNG'].net);
  assert.match(initial['net.PNG'].bam, /^[a-f0-9]{16}$/);
  assert.equal(initial['net.PNG'].loai, undefined);
  assert.equal(initial['lien-ket.PNG'], undefined);
  assert.deepEqual(await score(), initial);
  const cached = async () => JSON.parse(await readFile(cache, 'utf8')).anh['net.PNG'];
  const first = await cached();
  await utimes(image('net'), 100, 100);
  await score();
  const second = await cached();
  assert.notEqual(second.mtimeMs, first.mtimeMs);
  assert.equal(second.size, first.size);
  await copyFile(image('mo'), image('net'));
  await utimes(image('net'), 100, 100);
  assert.equal((await score())['net.PNG'].loai, 'mo');
  assert.equal((await cached()).mtimeMs, second.mtimeMs);
  assert.notEqual((await cached()).size, second.size);
  await writeFile(cache, 'null');
  assert.equal((await score())['net.PNG'].loai, 'mo');
});

test('bảng nguồn tạo mọi trang, giữ gọi một trang và --tat-ca bỏ lọc', async t => {
  const folder = await fixture(t, ['loc-anh.mjs', 'bang-nguon.sh']);
  await cp(path.join(root, 'fonts'), path.join(folder, 'fonts'), { recursive: true });
  const source = path.join(folder, 'nguon/bo-test');
  await mkdir(source, { recursive: true });
  const sample = path.join(source, 'Ảnh thật.JPG');
  await exec('magick', ['-size', '64x64', 'xc:#fcecff', '-fill', 'black',
    '-draw', 'rectangle 10,10 25,35', sample]);
  for (let index = 0; index < 40; index++) {
    await link(sample, path.join(source, `anh-${String(index).padStart(2, '0')}.JPG`));
  }
  const table = (...args) => exec('bash', [path.join(folder, 'tools/bang-nguon.sh'), 'bo-test', ...args]);
  const all = await table('--tat-ca');
  assert.match(all.stdout, /trang-tat-ca-1\.jpg \(trang 1\/2, 41 ảnh\)/);
  assert.match(all.stdout, /trang-tat-ca-2\.jpg \(trang 2\/2, 41 ảnh\)/);
  const sheetFolder = path.join(folder, 'ra/_bang-nguon/bo-test');
  const unfiltered = await readFile(path.join(sheetFolder, 'trang-tat-ca-1.jpg'));
  const filtered = await table();
  assert.match(filtered.stdout, /trang-1\.jpg \(trang 1\/1, 1 ảnh\)/);
  const page = await table('1');
  assert.equal(page.stdout, filtered.stdout);
  assert.deepEqual(await readFile(path.join(sheetFolder, 'trang-tat-ca-1.jpg')), unfiltered);
  assert.notDeepEqual(await readFile(path.join(sheetFolder, 'trang-1.jpg')), unfiltered);
  await access(path.join(sheetFolder, 'trang-tat-ca-2.jpg'));
  await assert.rejects(table('2'), /có 1 trang/);
  const { stdout } = await exec(process.execPath, [path.join(folder, 'tools/loc-anh.mjs'), 'bo-test', '--tat-ca']);
  assert(stdout.includes('Ảnh thật.JPG\n'));
});

test('bảng ưu tiên cắt giữa đúng 9:16 và vạch vùng chữ trên ảnh ngang', async t => {
  const folder = await fixture(t, ['loc-anh.mjs', 'bang-nguon.sh']);
  await cp(path.join(root, 'fonts'), path.join(folder, 'fonts'), { recursive: true });
  await mkdir(path.join(folder, 'nguon/bo-test'), { recursive: true });
  await mkdir(path.join(folder, 'kho'));
  await writeFile(path.join(folder, 'kho/bo-test-uu-tien.txt'), 'vang-mat.jpg\nanh-ngang.png\n');
  await exec('magick', ['-size', '320x160', 'xc:#ff5959', '-fill', '#3a9e3a', '-draw',
    'rectangle 110,0 210,159', '-fill', 'black', '-draw', 'rectangle 135,105 155,153 rectangle 170,105 190,153',
    path.join(folder, 'nguon/bo-test/anh-ngang.png')]);
  const { stdout } = await exec('bash', [path.join(folder, 'tools/bang-nguon.sh'), 'bo-test', '--uu-tien']);
  assert.match(stdout, /trang-uu-tien-1\.jpg \(trang 1\/1, 1 ảnh\)/);
  const page = path.join(folder, 'ra/_bang-nguon/bo-test/trang-uu-tien-1.jpg');
  const { stdout: pixels } = await exec('magick', [page, '-format',
    '%[fx:p{10,10}.g] %[fx:p{195,10}.g] %[fx:p{80,64}.b] %[fx:p{80,10}.b]', 'info:']);
  const [left, right, guide, plain] = pixels.split(' ').map(Number);
  assert(left > 0.55 && right > 0.55, 'center crop excludes red wings on both sides');
  assert(guide > 0.75 && plain < 0.3, 'blue detail guide starts at the expected scaled height');
});

test('sửa đuôi có hậu tố, giữ file đúng đuôi và không ghi đè file có sẵn', async t => {
  const folder = await fixture(t, ['sua-duoi.sh']);
  const existing = path.join(folder, 'ảnh.png');
  const uploaded = path.join(folder, 'ảnh.JPG');
  await exec('magick', ['-size', '12x12', 'xc:blue', existing]);
  await exec('magick', ['-size', '12x12', 'xc:red', `png:${uploaded}`]);
  const expected = await readFile(uploaded);
  const before = await readFile(existing);
  const { stdout } = await exec('bash', [path.join(folder, 'tools/sua-duoi.sh'), folder]);
  assert.match(stdout, /ảnh\.JPG -> .*ảnh-doi\.png/);
  await assert.rejects(access(uploaded), { code: 'ENOENT' });
  assert.deepEqual(await readFile(path.join(folder, 'ảnh-doi.png')), expected);
  assert.deepEqual(await readFile(existing), before);
});

test('đồng bộ offline cập nhật tai_ve trước khi hardlink, giữ nguồn cũ và từ chối HTML đội đuôi', async t => {
  const folder = await fixture(t, ['drive-kho.sh', 'sua-duoi.sh']);
  const file = name => path.join(folder, name);
  for (const name of ['bin', 'kho', 'nguon/_kho/nhom', 'nguon/bo-test']) await mkdir(file(name), { recursive: true });
  const freshId = 'AAAAAAAAAAAAAAAAAAAA';
  const legacyId = 'BBBBBBBBBBBBBBBBBBBB';
  const badId = 'CCCCCCCCCCCCCCCCCCCC';
  await writeFile(file('bin/curl'), `#!/bin/bash
set -eu
while [[ $1 != -o ]]; do shift; done
printf '%s\\n' "$3" >> "$FAKE_CURL_LOG"
case "$3" in
  *id=${freshId}*) cp -- "$FAKE_IMAGE" "$2" ;;
  *id=${badId}*) printf '<!DOCTYPE html><html></html>\\n' > "$2" ;;
  *) exit 99 ;;
esac
`, { mode: 0o755 });
  await exec('magick', ['-size', '12x12', 'xc:blue', file('response.png')]);
  await writeFile(file('nguon/_kho/nhom/ảnh.png'), 'Tên chuẩn đã có');
  await writeFile(file('nguon/bo-test/ảnh-doi.png'), 'Nguồn chính chủ');
  await writeFile(file('nguon/_kho/nhom/cu.JPG'), 'Để nguyên ảnh đã có trong kho');
  const catalog = file('kho/test.tsv');
  const original = 'nhom_drive\tsan_pham\tloai\ttai_ve\tdrive_id\tngay\tten_goc\tdung_lam\n' +
    `nhom\tbo-test+body-chung\tanh\tnhom/ảnh.JPG\t${freshId}\t\tảnh.JPG\t\n` +
    `nhom\tbo-test\tanh\tnhom/cu.JPG\t${legacyId}\t\tcu.JPG\t\n` +
    `nhom\tbo-test\tanh\tnhom/loi.JPG\t${badId}\t\tloi.JPG\t\n`;
  await writeFile(catalog, original);
  const sync = () => exec('bash', [file('tools/drive-kho.sh'), 'dong-bo'], {
    env: { ...process.env, PATH: file('bin') + ':' + process.env.PATH, FAKE_CURL_LOG: file('da-tai'), FAKE_IMAGE: file('response.png') },
  }).catch(error => error);
  const first = await sync();
  assert.equal(first.code, 1);
  assert.match(first.stdout, /Đã có 1, vừa tải 1, lỗi 1/);
  assert.match(first.stderr, /Không phải JPEG, PNG, HEIC hoặc WebP/);
  assert.equal(await readFile(catalog, 'utf8'), original.replace('/ảnh.JPG\t', '/ảnh-doi-2.png\t'));
  const correct = await stat(file('nguon/_kho/nhom/ảnh-doi-2.png'));
  assert.equal(correct.nlink, 3);
  for (const dir of ['nguon/bo-test', 'nguon/_kho/body-chung']) {
    assert.equal((await stat(file(dir + '/ảnh-doi-2.png'))).ino, correct.ino);
  }
  assert.equal(await readFile(file('nguon/bo-test/ảnh-doi.png'), 'utf8'), 'Nguồn chính chủ');
  assert.equal(await readFile(file('nguon/_kho/nhom/ảnh.png'), 'utf8'), 'Tên chuẩn đã có');
  assert.deepEqual((await readdir(file('nguon/_kho/nhom'))).sort(), ['cu.JPG', 'ảnh-doi-2.png', 'ảnh.png'].sort());
  const repeat = await sync();
  assert.equal(repeat.code, 1);
  assert.match(repeat.stdout, /Đã có 2, vừa tải 0, lỗi 1/);
  assert.equal((await readFile(file('da-tai'), 'utf8')).split('\n').filter(line => line.includes(freshId)).length, 1);
});
