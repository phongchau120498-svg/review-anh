#!/usr/bin/env node
// Đưa một bộ ảnh đã dựng và đã kiểm vào NHÁP TikTok (inbox của app) qua Postiz.
// Không đăng thẳng: người dùng mở app TikTok, xem lại và tự bấm Đăng trong 24 giờ.
//
//   node tools/dang-postiz.mjs ra/<sp>/<run_id> --caption "<mô tả>" [--tieu-de "<tối đa 90 ký tự>"]
//
// In ra đúng một dòng JSON: {ok, post_id, run, so_anh} hoặc {ok:false, loi}.
// Key đọc từ POSTIZ_API_KEY, hoặc dòng POSTIZ_API_KEY= trong POSTIZ_ENV_FILE
// (mặc định ra/.postiz-thu/thu.env). Không bao giờ in key.
import { existsSync, openAsBlob, readFileSync, realpathSync, appendFileSync, mkdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const raRoot = path.join(repo, 'ra');
const logFile = path.join(raRoot, '.postiz-dang', 'nhat-ky.jsonl');
const MAX_CAPTION = 2000; // TikTok cho tối đa 4000 ký tự ở bài ảnh; giữ ngắn cho bài review.
const MAX_ANH = 35; // giới hạn bài ảnh của TikTok
const MAX_BAI_24H = 5; // TikTok chỉ giữ tối đa 5 bài chờ trong inbox mỗi 24 giờ.

class Loi extends Error {}

function parseArgs(argv) {
  const out = { run: undefined, caption: undefined, tieuDe: '' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--caption') out.caption = argv[++i];
    else if (a === '--tieu-de') out.tieuDe = argv[++i] ?? '';
    else if (a.startsWith('--')) throw new Loi(`Không hiểu tùy chọn ${a}`);
    else if (out.run === undefined) out.run = a;
    else throw new Loi('Chỉ nhận một thư mục run');
  }
  if (!out.run) throw new Loi('Thiếu thư mục run, ví dụ ra/body-oil/<run_id>');
  if (typeof out.caption !== 'string' || !out.caption.trim()) throw new Loi('Thiếu --caption');
  if (out.caption.length > MAX_CAPTION) throw new Loi(`Caption dài hơn ${MAX_CAPTION} ký tự`);
  if ([...out.tieuDe].length > 90) throw new Loi('Tiêu đề TikTok tối đa 90 ký tự');
  return out;
}

// Chỉ nhận run nằm đúng ra/<sp>/<run_id>, có manifest và mọi ảnh đều kiểm đạt.
export function loadRun(runArg) {
  const abs = path.resolve(repo, runArg);
  if (!existsSync(abs)) throw new Loi('Không thấy thư mục run');
  const real = realpathSync(abs);
  const rel = path.relative(raRoot, real);
  const parts = rel.split(path.sep);
  if (rel.startsWith('..') || path.isAbsolute(rel) || parts.length !== 2 || parts.some(p => p.startsWith('.') || p.startsWith('_'))) {
    throw new Loi('Run phải nằm đúng ra/<san-pham>/<run_id>');
  }
  const manifestPath = path.join(real, 'manifest.json');
  if (!existsSync(manifestPath)) throw new Loi('Run không có manifest.json');
  const m = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (!Array.isArray(m.anh) || m.anh.length === 0) throw new Loi('Manifest không có ảnh');
  if (m.anh.length > MAX_ANH) throw new Loi(`Quá ${MAX_ANH} ảnh`);
  if (!Array.isArray(m.kiem) || m.kiem.length !== m.anh.length || !m.kiem.every(k => k?.dat === true)) {
    throw new Loi('Có ảnh chưa kiểm đạt, không đưa lên');
  }
  const files = m.anh.map(p => {
    const f = realpathSync(path.resolve(repo, p));
    if (path.dirname(f) !== real || !/\.jpe?g$/i.test(f) || !statSync(f).isFile()) throw new Loi(`Ảnh không hợp lệ: ${p}`);
    return f;
  });
  return { dir: real, run: path.relative(repo, real), files };
}

function readKey(env) {
  if (env.POSTIZ_API_KEY) return env.POSTIZ_API_KEY.trim();
  const file = env.POSTIZ_ENV_FILE || path.join(raRoot, '.postiz-thu', 'thu.env');
  if (existsSync(file)) {
    const line = readFileSync(file, 'utf8').split('\n').find(l => l.startsWith('POSTIZ_API_KEY='));
    const key = line?.slice('POSTIZ_API_KEY='.length).trim();
    if (key) return key;
  }
  throw new Loi('Chưa có POSTIZ_API_KEY');
}

function history() {
  if (!existsSync(logFile)) return [];
  return readFileSync(logFile, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
}

async function call(base, key, route, init = {}) {
  let res;
  try {
    res = await fetch(base + route, { ...init, headers: { Authorization: key, ...init.headers }, signal: AbortSignal.timeout(60_000) });
  } catch {
    throw new Loi('Không kết nối được Postiz (Docker có đang chạy?)');
  }
  const text = await res.text();
  if (res.status === 401) throw new Loi('Postiz từ chối API key');
  if (!res.ok) throw new Loi(`Postiz báo lỗi ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

export async function dang(argv, env = process.env) {
  const args = parseArgs(argv);
  const run = loadRun(args.run);
  const now = Date.now();
  const log = history();
  if (log.some(e => e.run === run.run)) throw new Loi('Run này đã đưa lên rồi. Dựng lại bản mới nếu cần đăng lại');
  if (log.filter(e => now - Date.parse(e.luc) < 86_400_000).length >= MAX_BAI_24H) {
    throw new Loi(`Đã đưa ${MAX_BAI_24H} bài trong 24 giờ, TikTok không nhận thêm vào inbox`);
  }

  const key = readKey(env);
  const base = (env.POSTIZ_URL || 'http://127.0.0.1:4007/api').replace(/\/$/, '');

  const kenh = (await call(base, key, '/public/v1/integrations')).filter(k => k.identifier === 'tiktok' && !k.disabled);
  if (kenh.length !== 1) throw new Loi(`Cần đúng 1 kênh TikTok đang bật trong Postiz, đang có ${kenh.length}`);

  const image = [];
  for (const f of run.files) {
    const form = new FormData();
    form.append('file', await openAsBlob(f, { type: 'image/jpeg' }), path.basename(f));
    const up = await call(base, key, '/public/v1/upload', { method: 'POST', body: form });
    if (!up?.id || !up?.path) throw new Loi('Postiz không trả id/path sau khi tải ảnh');
    image.push({ id: up.id, path: up.path });
  }

  const body = {
    type: 'now',
    shortLink: false,
    date: new Date(now).toISOString(),
    tags: [],
    posts: [{
      integration: { id: kenh[0].id },
      value: [{ content: args.caption, image }],
      settings: {
        __type: 'tiktok',
        title: args.tieuDe,
        // ponytail: luôn vào inbox (UPLOAD), người dùng tự bấm Đăng; mở DIRECT_POST khi luật duyệt đổi
        content_posting_method: 'UPLOAD',
        privacy_level: 'SELF_ONLY',
        duet: false,
        stitch: false,
        comment: true,
        autoAddMusic: 'yes',
        brand_content_toggle: false,
        brand_organic_toggle: false,
        video_made_with_ai: false,
      },
    }],
  };
  const created = await call(base, key, '/public/v1/posts', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const postId = Array.isArray(created) ? created[0]?.postId : created?.postId;

  mkdirSync(path.dirname(logFile), { recursive: true });
  appendFileSync(logFile, JSON.stringify({ luc: new Date(now).toISOString(), run: run.run, post_id: postId ?? null }) + '\n');
  return { ok: true, post_id: postId ?? null, run: run.run, so_anh: image.length, che_do: 'nhap-inbox-tiktok' };
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  dang(process.argv.slice(2)).then(
    r => console.log(JSON.stringify(r)),
    e => { console.log(JSON.stringify({ ok: false, loi: e instanceof Loi ? e.message : 'Lỗi không mong đợi' })); process.exitCode = 1; },
  );
}
