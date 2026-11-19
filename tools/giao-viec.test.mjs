import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { access, cp, link, lstat, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('..', import.meta.url));
const product = 'san-pham-mau';
const source = `nguon/${product}`;

const claudeStub = `#!/usr/bin/env node
const assert = require('node:assert/strict');
const { spawn, spawnSync } = require('node:child_process');
const { appendFileSync, readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const args = process.argv.slice(2);
appendFileSync(process.env.CLAUDE_STUB_MARKER, 'called\\n');
assert.equal(process.env.ANTHROPIC_API_KEY, undefined);
assert.equal(process.env.ANTHROPIC_BASE_URL, undefined);
assert.equal(process.env.ANTHROPIC_MODEL, 'opus');
if (args.includes('status')) {
  const authMethod = process.env.CLAUDE_STUB_CASE === 'api' ? 'api' : 'claude.ai';
  console.log(JSON.stringify({loggedIn:true,authMethod,apiProvider:'firstParty',subscriptionType:'pro'}));
  process.exit(0);
}
const arg = key => args[args.indexOf(key) + 1];
const cwd = process.cwd();
const product = '${product}';
const source = '${source}';
assert.equal(arg('--permission-mode'), 'dontAsk');
assert.equal(arg('--tools'), 'Read,Glob,Grep,Write,Edit,Bash');
assert(!args.includes('--allowedTools'));
for (const flag of ['--restricted', '--disable-slash-commands','--strict-mcp-config','--no-session-persistence']) assert(args.includes(flag));
const hook = JSON.parse(arg('--settings')).hooks.PreToolUse[0].hooks[0];
assert.equal(hook.onFailure, 'block');
function permission(tool_name, tool_input) {
  const call = spawnSync(hook.command, hook.args, {input:JSON.stringify({cwd,tool_name,tool_input}),encoding:'utf8'});
  assert.equal(call.status, 0, call.stderr);
  return JSON.parse(call.stdout).hookSpecificOutput;
}
const deny = (tool, data) => assert.equal(permission(tool, data).permissionDecision, 'deny');
const allow = (tool, data) => {
  const result = permission(tool, data);
  assert.equal(result.permissionDecision, 'allow', result.permissionDecisionReason);
  return result.updatedInput;
};
const bash = command => {
  const updated = allow('Bash', {command, dangerouslyDisableSandbox:true,run_in_background:true});
  assert.deepEqual(Object.keys(updated), ['command']);
  return spawnSync('/bin/bash', ['-c', updated.command], {encoding:'utf8'});
};
const draft = source + '/bo-anh.json';
const render = 'node tools/dung-bo-anh.mjs --trai-nghiem ' + draft;
const review = 'node tools/soat-chu.mjs ' + draft;
const page = 'tools/bang-nguon.sh ' + product + ' 1';
const scenario = process.env.CLAUDE_STUB_CASE;
const chosen = process.env.GIAO_VIEC_MODEL;
assert.deepEqual(args.filter(value => value.startsWith('--model=')), chosen ? ['--model=' + chosen] : []);
const prompt = args.at(-1);
const promptParts = ['docs/brand/chung/cach-nghi-content.md', 'docs/brand/moaw/thuong-hieu.md',
  'docs/brand/moaw/giong-van.md', 'docs/brand/moaw/vi-du.md', 'Mốc bài học 3', 'Mốc bài học 12', 'Ghi chú của anh (chuỗi JSON)'];
let prior = -1;
for (const part of promptParts) {
  assert(prompt.indexOf(part) > prior, part);
  prior = prompt.indexOf(part);
}
assert(!prompt.includes('Mốc bài học 2 |'));
assert(prompt.includes('tối đa 3 lượt dựng'));
assert(prompt.endsWith(JSON.stringify(scenario === 'cancel' ? '' : '\\\\n$() ; ghi chú')));
if (process.env.CLAUDE_STUB_CASE === 'timeout') process.exit(124);
if (scenario === 'failed-with-usage') {
  console.log(JSON.stringify({type:'result',subtype:'error_max_turns',is_error:true,
    duration_ms:500, usage:{input_tokens:7,output_tokens:4}, modelUsage:{'claude-opus-stub':{}}}));
  process.exit(1);
}
if (process.env.CLAUDE_STUB_CASE === 'cancel') {
  spawn('flock', [process.env.CLAUDE_STUB_MARKER + '.lock', '/bin/sh', '-c', 'touch "$1"; sleep 6',
    'sh', process.env.CLAUDE_STUB_MARKER + '.ready'], {detached:true,stdio:'ignore'}).unref();
  setInterval(() => {}, 1000);
  return;
}
for (const command of ['ls ' + source, 'tools/bang-nguon.sh other 1', 'tools/bang-nguon.sh other --tat-ca', page + ' && touch outside',
  page + ' > outside', page + '\\nwhoami', page + '$(whoami)', 'TOOLS=1 ' + page,
  'node tools/dung-bo-anh.mjs nguon/other/bo-anh.json', 'tools/tiktok-anh.sh chu a b c',
  'tools/tiktok-anh.sh kiem /etc/passwd', 'node tools/soat-chu.mjs nguon/other/bo-anh.json',
  'node tools/soat-chu.mjs --ban-hang ' + draft, review, 'tools/bang-nguon.sh ' + product + ' --tat-ca 1']) deny('Bash', {command});
allow('Bash', {command:page});
allow('Bash', {command:'tools/bang-nguon.sh ' + product + ' --tat-ca'});
deny('Read', {file_path:'private.txt'});
deny('Read', {file_path:source + '/symlink.jpg'});
deny('Read', {file_path:'docs/khac.md'});
assert.equal(allow('Read', {file_path:'docs/brand/moaw/giong-van.md'}).file_path, path.join(cwd,'docs/brand/moaw/giong-van.md'));
allow('Read', {file_path:'docs/brand/chung/cach-nghi-content.md'});
deny('Read', {file_path:'docs/brand/khac/giong-van.md'});
deny('Write', {file_path:'private.txt', content:'bad'});
deny('Edit', {file_path:source + '/brief.json', old_string:'a', new_string:'b'});
deny('Glob', {pattern:'../private.txt'});
assert.equal(allow('Glob', {path:'/tmp', pattern:source + '/**/*.jpg'}).pattern, '*.jpg');
assert.equal(allow('Grep', {path:'/tmp', pattern:'test', glob:'*'}).glob, '{brief,bo-anh}.json');
assert.equal(allow('Read', {file_path:source + '/mau-1.jpg'}).file_path, path.join(cwd,source,'mau-1.jpg'));
const write = allow('Write', {file_path:draft});
assert.equal(write.file_path, path.join(cwd,draft));
if (process.env.CLAUDE_STUB_CASE === 'sheet-link') {
  const result = bash('tools/bang-nguon.sh ' + product);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /File không an toàn/);
  process.exit(1);
}
if (process.env.CLAUDE_STUB_CASE === 'forged') {
  console.log(JSON.stringify({type:'result',subtype:'success',structured_output:{
    run_id:'2026-11-18T09-00-00-000Z-abcdef01',anh:['private.txt'],
  }}));
  process.exit(0);
}
const sheet = bash('tools/bang-nguon.sh ' + product);
assert.equal(sheet.status, 0, sheet.stderr);
assert.match(sheet.stdout, /trang-1\\.jpg/);
const all = bash('tools/bang-nguon.sh ' + product + ' --tat-ca');
assert.equal(all.status, 0, all.stderr);
assert.match(all.stdout, /trang-tat-ca-1\\.jpg/);
allow('Read', {file_path:'ra/_bang-nguon/' + product + '/trang-1.jpg'});
allow('Read', {file_path:'ra/_bang-nguon/' + product + '/trang-tat-ca-1.jpg'});
deny('Read', {file_path:'ra/_bang-nguon/other/trang-tat-ca-1.jpg'});
const slides = [1,2,3].map((i) => ({mau:i === 1 ? 'bia' : 'chi-tiet', nguon:source + '/mau-' + i + '.jpg',
  tieu_de:'Mẫu', ...(i === 1 ? {} : {y:['Ảnh mẫu','Bản nháp']})}));
const save = () => writeFileSync(write.file_path, JSON.stringify({san_pham:product,anh:slides}));
const forbiddenImage = scenario === 'forbidden-image';
if (forbiddenImage) slides[0].tieu_de = 'Trị viê.m';
if (scenario === 'success') {
  slides[0].tieu_de = 'Mua tại https://example.com';
  save();
  for (let i = 0; i < 2; i++) assert.match(bash(render).stderr, /Link trong chữ/);
  slides[0].tieu_de = 'Ảnh a a a a a a a a a a a a';
}
save();
const run = bash(render);
assert.equal(run.status, 0, run.stderr);
const data = JSON.parse(run.stdout);
assert.equal(data.soat_chu.dat, !forbiddenImage);
assert(data.kiem.every(row => row.dat));
if (scenario === 'success') assert.match(bash(render).stderr, /Đã dựng 3 lượt/);
slides[0].tieu_de = forbiddenImage ? 'Mẫu' : 'Trị viê.m';
save();
allow('Read', {file_path:data.bang_xem});
if (scenario === 'tampered') appendFileSync(data.anh[0], 'changed');
if (scenario === 'success') {
  const oversize = spawnSync('magick', ['-size','2400x2400','xc:gray','+noise','Random','-strip','-quality','100','jpeg:-'],
    {maxBuffer:20 * 1024 * 1024});
  assert.equal(oversize.status,0,oversize.stderr.toString());
  assert(oversize.stdout.length > 2*1024*1024);
  writeFileSync(data.bang_xem, oversize.stdout);
}
console.error('chỉ có trong log');
const caption = {threads: scenario === 'forbidden-caption' ? 'Hoàn hảo' : '🍑'.repeat(501), tiktok:'Bộ ảnh nháp'};
console.log(JSON.stringify({type:'result',subtype:'success',is_error:false,
  num_turns:9, duration_ms:2750, total_cost_usd:0.08,
  usage:{input_tokens:22, cache_creation_input_tokens:300, cache_read_input_tokens:2500, output_tokens:450},
  modelUsage: chosen ? {'claude-sonnet-stub':{}} : {'claude-opus-stub':{}}, structured_output:{
  run_id:data.run_id, bang_xem:'private.txt', anh:['private.txt'],
  ly_do:['Bìa','Chi tiết 1','Chi tiết 2'],caption,
}}));`;

test('giao-viec khóa quyền, xác minh ảnh và luôn trả một JSON', async t => {
  const fixture = await mkdtemp(path.join(os.homedir(), '.test giao-viec-'));
  t.after(() => rm(fixture, { recursive: true, force: true }));
  const file = name => path.join(fixture, name);
  const marker = file('called');
  await mkdir(file('bin'));
  await mkdir(file('tools'));
  await mkdir(file(source), { recursive: true });
  for (const name of ['giao-viec.sh', 'giao-viec.mjs', 'bang-nguon.sh', 'loc-anh.mjs', 'dung-bo-anh.mjs', 'brand.mjs', 'soat-chu.mjs']) {
    await cp(path.join(repo, 'tools', name), file(`tools/${name}`));
  }
  for (const name of ['fonts', 'mau', 'docs/brand']) await cp(path.join(repo, name), file(name), { recursive: true });
  const lessons = Array.from({ length: 12 }, (_, index) => `| BH-20261119-${index + 1} | Mốc bài học ${index + 1} |`).join('\n');
  await writeFile(file('docs/brand/moaw/bai-hoc.md'), `${lessons}\n\n## Đã đưa vào brand`);
  await writeFile(file('docs/khac.md'), 'khac');
  await mkdir(file('docs/brand/khac'));
  await writeFile(file('docs/brand/khac/giong-van.md'), 'khac');
  await symlink(path.join(repo, 'node_modules'), file('node_modules'), 'dir');
  await writeFile(file('bin/claude'), claudeStub, { mode: 0o755 });
  await writeFile(file('private.txt'), 'private');
  await symlink(file('private.txt'), file(`${source}/symlink.jpg`));
  for (const i of [1, 2, 3]) {
    const output = spawnSync('magick', ['-size', '500x780', 'xc:#efe4c8', '-fill', 'black', '-draw',
      'rectangle 90,90 340,440', '-strip', file(`${source}/mau-${i}.jpg`)]);
    assert.equal(output.status, 0, output.stderr.toString());
  }
  const env = {
    PATH: `${file('bin')}:${process.env.PATH}`, HOME: os.homedir(), LANG: 'C.UTF-8',
    CLAUDE_CONFIG_DIR: file('bin'), CLAUDE_STUB_MARKER: marker, ANTHROPIC_API_KEY: 'stub', ANTHROPIC_BASE_URL: 'stub',
  };
  await writeFile(file('bin/settings.json'), '{"model":"opus"}');
  function run(scenario, target = product, extraEnv) {
    const result = spawnSync(file('tools/giao-viec.sh'), [target, '\\n$() ; ghi chú'], {
      cwd: repo, env: { ...env, CLAUDE_STUB_CASE: scenario, ...extraEnv }, encoding: 'utf8', timeout: 20000,
    });
    assert.ifError(result.error);
    assert.equal(result.stderr, '');
    return { status: result.status, value: JSON.parse(result.stdout) };
  }
  assert.deepEqual(run('missing', 'body-oil'), { status: 1, value: { ok: false, loi: 'Thiếu thư mục ảnh nguon/body-oil/' } });
  assert.deepEqual(run('invalid', '../sp'), { status: 1, value: { ok: false, loi: 'Dùng: tools/giao-viec.sh <sp> [ghi-chu]' } });
  assert.deepEqual(run('invalid', product, { GIAO_VIEC_MODEL: 'sonnet;whoami' }),
    { status: 1, value: { ok: false, loi: 'GIAO_VIEC_MODEL không hợp lệ' } });
  await assert.rejects(access(marker), { code: 'ENOENT' });
  await link(file('private.txt'), file(`${source}/bo-anh.json`));
  assert.match(run('hard-link').value.loi, /File không an toàn.*bo-anh\.json/);
  await assert.rejects(access(marker), { code: 'ENOENT' });
  await rm(file(`${source}/bo-anh.json`));
  assert.match(run('api').value.loi, /cần đăng nhập gói Claude/);
  assert.deepEqual(run('timeout'), { status: 1, value: { ok: false, loi: 'het-gio' } });
  assert.match(run('forged').value.loi, /Không hoàn thành lượt dựng/);
  await rm(file('ra/' + product), { recursive: true });
  const sheetPath = file(`ra/_bang-nguon/${product}/trang-1.jpg`);
  await link(file('private.txt'), sheetPath);
  assert.equal(run('sheet-link').status, 1);
  assert.match(await readFile(file('private.txt'), 'utf8'), /^private$/);
  const reportPath = file('ra/' + product);
  const [scratch] = await readdir(reportPath);
  assert.match(await readFile(path.join(reportPath, scratch, 'giao-viec.log'), 'utf8'), /Claude Code không hoàn thành/);
  await rm(sheetPath);
  const result = run('success');
  assert.equal(result.status, 0, result.value.loi);
  const { ok, run_id, bang_xem, anh, ly_do, caption, canh_bao, do_luong } = result.value;
  assert.equal(ok, true);
  assert.deepEqual(caption, { threads: '🍑'.repeat(501), tiktok: 'Bộ ảnh nháp' });
  assert.deepEqual(canh_bao, [
    { loai: 'do-dai', cho: 'anh[0].tieu_de', gioi_han: 12, thuc_te: 13 },
    { loai: 'do-dai', cho: 'caption.threads', gioi_han: 500, thuc_te: 501 },
  ]);
  assert.equal(ly_do.length, 3);
  assert.deepEqual(do_luong, { model: 'claude-opus-stub', so_vong: 9, giay: 2.75, token_vao: 22,
    cache_ghi: 300, cache_doc: 2500, token_ra: 450, gia_api_usd: 0.08 });
  assert.equal(await readFile(file('ra/_do-luong.tsv'), 'utf8'),
    `run_id\tsan_pham\tmodel\tso_vong\tgiay\ttoken_vao\tcache_ghi\tcache_doc\ttoken_ra\tgia_api_usd\n${run_id}\t${product}\tclaude-opus-stub\t9\t2.75\t22\t300\t2500\t450\t0.08\n`);
  assert((await lstat(file(`ra/_bang-nguon/${product}/.cham-anh.json`))).isFile());
  await assert.rejects(access(file(`${source}/.cham-anh.json`)), { code: 'ENOENT' });
  const base = `ra/${product}/${run_id}`;
  assert.deepEqual(JSON.parse(await readFile(file(`${base}/manifest.json`), 'utf8')).brief, {});
  assert.equal(bang_xem, `${base}/_xem/bang-ket-qua-nen.jpg`);
  assert.deepEqual(anh, ['01', '02', '03'].map(num => `${base}/${num}.jpg`));
  for (const image of [bang_xem, ...anh]) {
    const info = await lstat(file(image));
    assert(info.isFile() && info.nlink === 1 && info.size <= 2 * 1024 * 1024);
  }
  assert.match(await readFile(file(`${base}/_xem/giao-viec.log`), 'utf8'), /chỉ có trong log/);

  for (const [scenario, message] of [['forbidden-caption', 'caption.threads (hoàn hảo)'],
    ['forbidden-image', 'anh[0].tieu_de (trị viêm)']]) {
    const failed = run(scenario, product, scenario === 'forbidden-caption' ? { GIAO_VIEC_MODEL: 'sonnet' } : {});
    assert.equal(failed.status, 1);
    assert.equal(failed.value.ok, false);
    assert(failed.value.loi.startsWith(`Chữ vi phạm: ${message}`), failed.value.loi);
    assert.equal(failed.value.do_luong.model, scenario === 'forbidden-caption' ? 'claude-sonnet-stub' : 'claude-opus-stub');
  }
  assert.match(run('tampered').value.loi, /Ảnh đã đổi sau khi kiem/);
  const tsv = file('ra/_do-luong.tsv');
  const beforeFailure = await readFile(tsv, 'utf8');
  assert.equal(beforeFailure.trim().split('\n').length, 5);
  const failed = run('failed-with-usage');
  assert.equal(failed.status, 1);
  assert.equal(failed.value.ok, false);
  assert.match(failed.value.loi, /^Claude Code không hoàn thành lượt dựng/);
  assert.deepEqual(failed.value.do_luong, { model: 'claude-opus-stub', so_vong: null, giay: 0.5,
    token_vao: 7, cache_ghi: null, cache_doc: null, token_ra: 4, gia_api_usd: null });
  assert.equal(await readFile(tsv, 'utf8'), beforeFailure +
    ["", product, 'claude-opus-stub', '', 0.5, 7, '', '', 4, ''].join('\t') + '\n');

  // Match the detached /bin/sh and group-wide SIGKILL used by sharedCommand.
  const request = spawn('/bin/sh', ['-c', 'exec "$1" "$2"', 'sh', file('tools/giao-viec.sh'), product], {
    cwd: repo, detached: true, stdio: 'ignore', env: { ...env, CLAUDE_STUB_CASE: 'cancel' },
  });
  const closed = once(request, 'close');
  try {
    for (let i = 0; i < 100; i++) {
      if (await access(marker + '.ready').then(() => true, () => false)) break;
      await delay(20);
    }
    await access(marker + '.ready');
    const available = () => spawnSync('flock', ['-n', marker + '.lock', 'true']).status === 0;
    assert.equal(available(), false);
    process.kill(-request.pid, 'SIGKILL');
    assert.equal((await closed)[1], 'SIGKILL');
    for (let i = 0; i < 30 && !available(); i++) await delay(20);
    assert.equal(available(), true, 'tool child must release its lock after revocation');
  } finally {
    if (request.exitCode === null && request.signalCode === null) process.kill(-request.pid, 'SIGKILL');
    await closed;
  }
});
