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
const page = 'tools/bang-nguon.sh ' + product + ' 1';
if (process.env.CLAUDE_STUB_CASE === 'timeout') process.exit(124);
if (process.env.CLAUDE_STUB_CASE === 'cancel') {
  spawn('flock', [process.env.CLAUDE_STUB_MARKER + '.lock', '/bin/sh', '-c', 'touch "$1"; sleep 6',
    'sh', process.env.CLAUDE_STUB_MARKER + '.ready'], {detached:true,stdio:'ignore'}).unref();
  setInterval(() => {}, 1000);
  return;
}
for (const command of ['ls ' + source, 'tools/bang-nguon.sh other 1', page + ' && touch outside',
  page + ' > outside', page + '\\nwhoami', page + '$(whoami)', 'TOOLS=1 ' + page,
  'node tools/dung-bo-anh.mjs nguon/other/bo-anh.json', 'tools/tiktok-anh.sh chu a b c',
  'tools/tiktok-anh.sh kiem /etc/passwd']) deny('Bash', {command});
deny('Read', {file_path:'private.txt'});
deny('Read', {file_path:source + '/symlink.jpg'});
deny('Write', {file_path:'private.txt', content:'bad'});
deny('Edit', {file_path:source + '/brief.json', old_string:'a', new_string:'b'});
deny('Glob', {pattern:'../private.txt'});
assert.equal(allow('Glob', {path:'/tmp', pattern:source + '/**/*.jpg'}).pattern, '*.jpg');
assert.equal(allow('Grep', {path:'/tmp', pattern:'test', glob:'*'}).glob, '{brief,bo-anh}.json');
assert.equal(allow('Read', {file_path:source + '/mau-1.jpg'}).file_path, path.join(cwd,source,'mau-1.jpg'));
const write = allow('Write', {file_path:draft});
assert.equal(write.file_path, path.join(cwd,draft));
if (process.env.CLAUDE_STUB_CASE === 'sheet-link') {
  const result = bash(page);
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
const sheet = bash(page);
assert.equal(sheet.status, 0, sheet.stderr);
allow('Read', {file_path:'ra/_bang-nguon/' + product + '/trang-1.jpg'});
const slides = [1,2,3].map((i) => ({mau:i === 1 ? 'bia' : 'chi-tiet', nguon:source + '/mau-' + i + '.jpg',
  tieu_de:'Mẫu', ...(i === 1 ? {} : {y:['Ảnh mẫu','Bản nháp']})}));
writeFileSync(write.file_path, JSON.stringify({san_pham:product,anh:slides}));
const run = bash(render);
assert.equal(run.status, 0, run.stderr);
const data = JSON.parse(run.stdout);
allow('Read', {file_path:data.bang_xem});
const check = bash('tools/tiktok-anh.sh kiem ' + data.thu_muc + '/*.jpg');
assert.equal(check.status, 0, check.stderr);
const oversize = spawnSync('magick', ['-size','2400x2400','xc:gray','+noise','Random','-strip','-quality','100','jpeg:-'],
  {maxBuffer:20 * 1024 * 1024});
assert.equal(oversize.status,0,oversize.stderr.toString());
assert(oversize.stdout.length > 2*1024*1024);
writeFileSync(data.bang_xem, oversize.stdout);
console.error('chỉ có trong log');
console.log(JSON.stringify({type:'result',subtype:'success',is_error:false,structured_output:{
  run_id:data.run_id, bang_xem:'private.txt', anh:['private.txt'],
  ly_do:['Bìa','Chi tiết 1','Chi tiết 2'],caption:{threads:'Bản nháp',tiktok:'Bộ ảnh nháp'},
}}));`;

test('giao-viec khóa quyền, xác minh ảnh và luôn trả một JSON', async t => {
  const fixture = await mkdtemp(path.join(os.homedir(), '.test giao-viec-'));
  t.after(() => rm(fixture, { recursive: true, force: true }));
  const file = name => path.join(fixture, name);
  const marker = file('called');
  await mkdir(file('bin'));
  await mkdir(file('tools'));
  await mkdir(file(source), { recursive: true });
  for (const name of ['giao-viec.sh', 'giao-viec.mjs', 'bang-nguon.sh', 'dung-bo-anh.mjs', 'tiktok-anh.sh']) {
    await cp(path.join(repo, 'tools', name), file(`tools/${name}`));
  }
  for (const name of ['fonts', 'mau']) await cp(path.join(repo, name), file(name), { recursive: true });
  await symlink(path.join(repo, 'node_modules'), file('node_modules'), 'dir');
  await writeFile(file('bin/claude'), claudeStub, { mode: 0o755 });
  await writeFile(file('private.txt'), 'private');
  await symlink(file('private.txt'), file(`${source}/symlink.jpg`));
  for (const i of [1, 2, 3]) {
    const output = spawnSync('magick', ['-size', '500x780', 'xc:#efe4c8', '-strip', file(`${source}/mau-${i}.jpg`)]);
    assert.equal(output.status, 0, output.stderr.toString());
  }
  const env = {
    PATH: `${file('bin')}:${process.env.PATH}`, HOME: os.homedir(), LANG: 'C.UTF-8',
    CLAUDE_CONFIG_DIR: file('bin'), CLAUDE_STUB_MARKER: marker, ANTHROPIC_API_KEY: 'stub', ANTHROPIC_BASE_URL: 'stub',
  };
  await writeFile(file('bin/settings.json'), '{"model":"opus"}');
  function run(scenario, target = product) {
    const result = spawnSync(file('tools/giao-viec.sh'), [target, '\\n$() ; ghi chú'], {
      cwd: repo, env: { ...env, CLAUDE_STUB_CASE: scenario }, encoding: 'utf8', timeout: 20000,
    });
    assert.ifError(result.error);
    assert.equal(result.stderr, '');
    return { status: result.status, value: JSON.parse(result.stdout) };
  }
  assert.deepEqual(run('missing', 'body-oil'), { status: 1, value: { ok: false, loi: 'Thiếu thư mục ảnh nguon/body-oil/' } });
  assert.deepEqual(run('invalid', '../sp'), { status: 1, value: { ok: false, loi: 'Dùng: tools/giao-viec.sh <sp> [ghi-chu]' } });
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
  const { ok, run_id, bang_xem, anh, ly_do, caption } = result.value;
  assert.equal(ok, true);
  assert.deepEqual(caption, { threads: 'Bản nháp', tiktok: 'Bộ ảnh nháp' });
  assert.equal(ly_do.length, 3);
  const base = `ra/${product}/${run_id}`;
  assert.deepEqual(JSON.parse(await readFile(file(`${base}/manifest.json`), 'utf8')).brief, {});
  assert.equal(bang_xem, `${base}/_xem/bang-ket-qua-nen.jpg`);
  assert.deepEqual(anh, ['01', '02', '03'].map(num => `${base}/${num}.jpg`));
  for (const image of [bang_xem, ...anh]) {
    const info = await lstat(file(image));
    assert(info.isFile() && info.nlink === 1 && info.size <= 2 * 1024 * 1024);
  }
  assert.match(await readFile(file(`${base}/_xem/giao-viec.log`), 'utf8'), /chỉ có trong log/);

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
