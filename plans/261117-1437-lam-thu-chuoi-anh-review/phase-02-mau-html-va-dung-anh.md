---
phase: 2
title: Mẫu HTML và dựng ảnh
status: in-progress
priority: P1
dependencies: []
---

# Phase 2: Mẫu HTML và dựng ảnh

## Overview

Định nghĩa `brief.json` và cấu trúc `nguon/<sp>/`. Dựng ảnh từ mẫu HTML/CSS và chụp lại bằng Playwright, có chặn việc chèn mã vào HTML. Kết quả cuối là một lệnh nhận JSON bộ ảnh và trả về bộ ảnh 1080x1920 đạt chuẩn đăng.

## Requirements

- **Brief:** `nguon/<sp>/brief.json` gồm các trường:
  - `ten`
  - `diem_noi_bat` (3 ý)
  - `gia`
  - `link`
  
  Chuyển 3–4 ảnh trong `nguon/` vào một thư mục sản phẩm mẫu. Anh cung cấp thông tin brief (câu hỏi mở 5).
- **Mẫu ảnh:** bắt đầu với 2 mẫu:
  - bìa: ảnh nền và câu móc;
  - chi tiết: ảnh, tiêu đề và 2–3 ý.
  
  Mẫu kêu gọi kèm giá chỉ thêm sau khi anh duyệt phong cách.
- **Font:** miễn phí, giấy phép OFL (Be Vietnam Pro hoặc Noto Sans), đặt trong `fonts/`. Kiểm đủ dấu tiếng Việt.
- **Vùng an toàn của TikTok:** chừa 220px trên, 520px dưới, 170px bên phải. Chữ dài tự xuống dòng và co cỡ, không tràn.
- **JSON bộ ảnh:** đường dẫn tính theo gốc repo. Caption không nằm ở đây mà thuộc bước đăng.

```json
{ "san_pham": "kem-duong-x",
  "anh": [
    { "mau": "bia", "nguon": "nguon/kem-duong-x/IMG_2240.jpg", "tieu_de": "...", "phu": "..." },
    { "mau": "chi-tiet", "nguon": "nguon/kem-duong-x/IMG_2255.jpg", "tieu_de": "...", "y": ["...", "..."] } ] }
```

- **Chặn chèn mã khi dựng ảnh** (bắt buộc):
  - Chữ chỉ được gán bằng `textContent`, không bao giờ qua `innerHTML`.
  - Tắt JavaScript của trang (`javaScriptEnabled: false`).
  - Đặt CSP `default-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline'`.
  - Ảnh nguồn và font nhúng thẳng vào trang dưới dạng data URI, sau khi đã kiểm đường dẫn.
  - `page.route` chặn mọi yêu cầu mạng và `file://`.
- **Đường dẫn:**
  - Gốc repo tính từ vị trí file script, không phụ thuộc thư mục đang đứng.
  - Mọi đường dẫn qua `realpath` và phải nằm trong `nguon/` hoặc `ra/`.
  - `san_pham` được chuẩn hóa về `[a-z0-9-]` (NFC, bỏ dấu).
- **Kết quả ra:** dựng vào thư mục tạm rồi đổi tên một lần sang `ra/<sp>/<run-id>/`. Thư mục đó gồm:
  - `manifest.json`, liệt kê đúng các ảnh sẽ đăng;
  - thư mục `_xem/` chứa bảng xem trước, tách khỏi ảnh đăng.
- **`kiem`:** báo đạt hoặc lỗi cho **từng ảnh**, xong mới trả mã lỗi chung. Ảnh phải đạt cả:
  - chuẩn TikTok: 1080x1920, sRGB, không metadata, dưới 20 MB;
  - chuẩn Threads: JPEG, tối đa 8 MB.
- **Thư viện:** ghim đúng phiên bản và commit `package-lock.json`. Cài Chromium bằng `npx playwright install chromium` theo đúng phiên bản Playwright đã ghim.

## Architecture

1. Đọc JSON.
2. Kiểm đường dẫn và tên sản phẩm.
3. Đổi ảnh HEIC hoặc PNG sang JPEG bằng ImageMagick.
4. Nhúng ảnh vào trang dưới dạng data URI.
5. Dựng trang bằng Playwright (tắt JavaScript, có CSP, chặn mạng), chụp lại 1080x1920.
6. ImageMagick chuyển sRGB, xóa metadata.
7. Chạy `kiem` cho từng ảnh.
8. Ghi `manifest.json`.

## Related Code Files

- Create:
  - `package.json`, `package-lock.json`
  - `mau/bia.html`, `mau/chi-tiet.html`, `mau/chung.css`
  - `fonts/`
  - `tools/dung-bo-anh.mjs`
  - `tools/dung-bo-anh.test.mjs`
  - `docs/brief-mau.json`
- Modify:
  - `tools/tiktok-anh.sh`: `kiem` báo từng ảnh và thêm luật của Threads; `luoi` ghi vào `_xem/`.
  - `README.md`
- **Giữ nguyên** lệnh `chu` cho tới khi anh duyệt phong cách mẫu mới.

## Implementation Steps

1. Chọn và tải font, kiểm giấy phép.
2. Định nghĩa schema `brief.json`, tạo một sản phẩm mẫu.
3. Viết 2 mẫu, tham khảo `docs/tham-khao-mau-thiet-ke.md` (chỉ lấy ý).
4. Viết `dung-bo-anh.mjs` theo các ràng buộc ở trên.
5. Viết test:
   - chữ 120 ký tự;
   - đủ các dấu tiếng Việt (ỗ, ự, ẫ);
   - `tieu_de` chứa `<iframe src="file:///etc/passwd">` phải hiện ra đúng nguyên văn chữ;
   - `san_pham` chứa `../../x` bị chuẩn hóa;
   - đường dẫn dạng symlink ra ngoài repo bị từ chối.
6. Gửi bảng xem trước cho anh duyệt phong cách.

## Success Criteria

- [x] Một lệnh từ JSON ra ảnh trong `ra/<sp>/<run-id>/`, có `manifest.json`. Mọi ảnh qua `kiem`.
- [x] Các test trên đều đạt.
- [ ] Anh duyệt phong cách, hoặc góp ý để sửa một vòng.

## Risk Assessment

- **Chèn mã vào HTML làm lộ file:** chặn bằng `textContent`, CSP, tắt JavaScript, chặn mạng; có test.
- **Font thiếu dấu:** đã có test dấu.
- **Ảnh HEIC:** đổi sang JPEG trước khi dựng.

## Kết quả phase 2 — 17/11/2026

- Giữ `in-progress`: phần kỹ thuật xong, **chờ anh duyệt phong cách/brief thật**, chưa thêm CTA và chưa duyệt thay anh. Anh xác nhận ưu tiên TikTok dọc 9:16; mỗi ảnh là 1080x1920, bảng xem chỉ ghép ngang để duyệt.
- Đã đọc kết quả kiểm thiết lập phase 1 trước khi code; không sửa OpenMausBot, app thật, model/provider, không gọi AI trả phí, không push/deploy.
- Đã **copy** ba JPEG `IMG_1861`, `IMG_2240`, `IMG_2297` sang `nguon/san-pham-mau/`, giữ nguyên nguồn gốc. Copy thêm `IMG_1765.heic` chỉ để kiểm decoder. Mọi chữ/brief ghi rõ MẪU; giá `MẪU: 123.000 đ`, link `example.com` không dùng như thông tin sản phẩm thật. Không suy diễn công dụng.
- Bộ ba ảnh: `ra/san-pham-mau/2026-11-17T08-03-35-793Z-3c5ba15c/`. Bảng gửi anh: `_xem/bang-ket-qua.jpg`; ảnh riêng đầu tiên: `01.jpg`. Manifest chỉ liệt kê `01.jpg`, `02.jpg`, `03.jpg`; bytes lần lượt 488164, 220297, 266063. Đã xem bảng để kiểm chữ không mất/tràn; **không coi đó là duyệt phong cách**.
- `node tools/dung-bo-anh.mjs nguon/san-pham-mau/bo-anh.json`: dựng đủ ba ảnh, mỗi `kiem.dat=true`. `tools/tiktok-anh.sh kiem ra/san-pham-mau/2026-11-17T08-03-35-793Z-3c5ba15c/*.jpg`: cả ba Đạt.
- `npm install --ignore-scripts`: ghim Playwright 1.65.1 cùng lock. `npx playwright install chromium`: cài Chromium v1255 đúng phiên bản; lệnh Playwright tự dọn browser cache cũ không còn dùng. Không thay cấu hình app.
- `npm test`: 7/7 nhóm test đạt; có Chromium thật cho 120 ký tự/dấu Việt/custom font Be Vietnam Pro, iframe hiện nguyên văn, CSP/tắt JS/chặn HTTP và file, chữ quá dài báo lỗi, JPEG/PNG, SVG đội .jpg, path traversal/symlink, giá/link/domain, metadata/8MB/20MB, kiểm tiếp sau lỗi và CLI từ `/tmp`. Test tự tạo/dọn fixture trong `nguon/`/`ra/`.
- `magick identify ... heic:nguon/IMG_1765.heic`: HEIC 2268x4032. `renderSet` trên bản copy HEIC thật: JPEG 1080x1920 đạt kiểm, 301374 byte tại run `2026-11-17T08-05-58-390Z-6902be08`. Máy chỉ decode HEIC, không encode; test tự động dùng JPEG/PNG và kiểm HEIC bằng tư liệu thật này.
- `node --check tools/dung-bo-anh.mjs`, `node --check tools/dung-bo-anh.test.mjs`, `bash -n tools/tiktok-anh.sh`, `sh -n .githooks/pre-commit`, `git diff --check`: đạt. `npm audit --omit=dev`: 0 vulnerabilities. Chưa chạy gate toàn plan; parent kiểm chung cuối plan.
- `.githooks/pre-commit` được version hóa, fail-closed nếu thiếu/sai Gitleaks 8.30.1; `core.hooksPath=.githooks`. `git check-ignore` xác nhận `nguon/`, `ra/`, `node_modules`, `postiz/.env`, `postiz/data/` bị bỏ qua; `.env.example` được cho phép.
- `ck plan check 2 --start` chạy từ thư mục plan: thành công. CLI đổi nhầm Applied To của Red Team #2; đã khôi phục nguyên `phase 4, 5, 6` ngay sau đó, giữ mọi quyết định Red Team/Ngoại lệ.
- Contract cho phase 4: `renderSet(data,{browser,timeoutMs})` trả `{san_pham,run_id,thu_muc,manifest,anh:[path],brief,kiem:[{path,dat,bytes,loi}],bang_xem}`. Manifest giữ `anh` là danh sách path tính từ gốc repo; `_xem` tách riêng. Export dùng lại `ROOT`, `normalizeProduct`, `safePath`, `readBrief`, `validateCopy`, `checkImages`, `createPreview`; xem README. Giá trong chữ chỉ hỗ trợ số + đơn vị được ghi rõ, không tự kiểm chứng nội dung review.
- Caller cũ `chu` cũng smoke-test với font Be Vietnam Pro đã bundle: `TIKTOK_ANH_FONT=... tools/tiktok-anh.sh chu nguon/san-pham-mau/IMG_1861.jpg ra/kiem-chu/1.jpg "MẪU: chữ kiểu cũ" tren`: Đạt; đã dọn riêng thư mục smoke-test. Không đổi logic `chu`/`khung`.
- Chạy trực tiếp `.githooks/pre-commit` trên 18 file staged: Gitleaks 8.30.1 quét ~45.47 KB, no leaks found; không stage `nguon/`/`ra/` hay file Postiz của phiên khác.
