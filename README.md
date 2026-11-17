# review-anh

Làm series review dạng ảnh từ kho tư liệu sản phẩm, ưu tiên TikTok dọc **9:16, 1080x1920**, đồng thời kiểm chuẩn JPEG của Threads. Repo chỉ dựng/kiểm ảnh; về sau MausBot điều khiển qua MCP.

## Cấu trúc

- `tools/dung-bo-anh.mjs`: dựng ảnh từ JSON và mẫu HTML; xuất manifest và bảng xem.
- `tools/tiktok-anh.sh`: trích khung, chèn chữ kiểu cũ, dựng bảng và kiểm ảnh.
- `mau/`: bìa và chi tiết; chưa thêm mẫu giá/CTA vì còn chờ duyệt phong cách.
- `fonts/`: Be Vietnam Pro Regular/Bold, kèm giấy phép OFL 1.1; nguồn [Google Fonts](https://github.com/google/fonts/tree/main/ofl/bevietnampro).
- `nguon/<san-pham>/`: `brief.json`, ảnh/video và JSON bộ ảnh; **không vào Git**.
- `ra/<san-pham>/<run-id>/`: JPEG, `manifest.json`, `_xem/bang-ket-qua.jpg`; **không vào Git**. Chỉ ảnh trong manifest dùng để đăng.
- `docs/huong-lam.md`: kiến trúc và điều kiện đăng.

## Cài trên máy

Cần Node.js 22+, FFmpeg/ffprobe, ImageMagick 7 (`magick`) có decoder HEIC, Gitleaks **8.30.1**. Lệnh chữ kiểu cũ dùng Noto Sans Bold hệ thống (đổi bằng `TIKTOK_ANH_FONT`).

```bash
npm ci
npx playwright install chromium
git config core.hooksPath .githooks
npm test
```

Playwright ghim phiên bản trong `package.json`/lock. Hook từ chối commit nếu thiếu/sai phiên bản Gitleaks hoặc quét staged phát hiện secret. Sau clone cần đặt `core.hooksPath` như trên; không commit token, `.env`, tư liệu hay ảnh xuất.

## Dựng bộ ảnh

Mỗi sản phẩm cần `nguon/<slug>/brief.json` theo [ví dụ MẪU](docs/brief-mau.json): `ten`, đúng 3 `diem_noi_bat`, `gia` và `link` là chuỗi, `domains_thuong_hieu` là danh sách hostname chính xác (không tự cho phép subdomain). Link bắt buộc HTTPS và thuộc danh sách này. Brief/JSON tối đa 100 KB.

JSON bộ ảnh theo [bộ MẪU](docs/bo-anh-mau.json), gồm `san_pham` và `anh` (1–20 ảnh):

- `mau: "bia"`: `nguon`, `tieu_de`, `phu` tùy chọn.
- `mau: "chi-tiet"`: `nguon`, `tieu_de`, `y` gồm 2–3 ý.
- `gia`/`link` tùy chọn ở cấp bộ ảnh phải khớp nguyên văn brief. Caption thuộc bước đăng, không nằm trong JSON này.

```bash
node tools/dung-bo-anh.mjs nguon/san-pham-mau/bo-anh.json
tools/tiktok-anh.sh kiem ra/san-pham-mau/<run-id>/*.jpg
tools/tiktok-anh.sh luoi ra/san-pham-mau/<run-id>/*.jpg
```

CLI trả JSON gồm `san_pham`, `run_id`, `thu_muc`, `manifest`, `anh` (danh sách đường dẫn ảnh đăng), `kiem` (kết quả từng ảnh), `brief` (tên/giá/link), `bang_xem`. Đường dẫn tính theo gốc repo dù chạy từ thư mục khác. Tên sản phẩm chuẩn hóa NFC, bỏ dấu về `[a-z0-9-]` và được trả lại rõ trong kết quả. Ảnh nguồn bắt buộc ở đúng thư mục sản phẩm; mọi nguồn/đích dùng realpath + path.relative để chặn traversal và symlink thoát `nguon/`/`ra/`. Dựng vào thư mục tạm rồi đổi tên một lần khi cả bộ đạt.

Chữ được gán bằng `textContent`. Trang tắt JavaScript, có CSP, nhúng font/raster data URI và chặn mọi yêu cầu mạng/file. Decoder ảnh ép theo đuôi JPEG/PNG/HEIC/WebP để từ chối SVG/MVG giả ảnh. Vùng chữ chừa ít nhất 220px trên, 520px dưới và 170px phải; chữ tự xuống dòng/co cỡ, không đủ chỗ thì báo lỗi và bỏ bản tạm.

Giá trong chữ hỗ trợ số có dấu phân cách `.`/`,`/khoảng trắng kèm `đ`, `₫`, `VNĐ`, `VND`, `k`, `nghìn`, `triệu`; đoạn giá phải khớp nguyên văn trong brief. URL `http(s)://` hoặc `www.` trong chữ cũng phải bằng nguyên link brief, tách khỏi dấu câu. Không dùng cách viết giá bằng chữ hay số trần để né kiểm; công cụ không kiểm chứng công dụng hay sự thật thay người duyệt.

`kiem` báo đủ từng ảnh rồi mới trả mã lỗi chung: JPEG, 1080x1920, sRGB, không profile/comment/metadata, dưới 20.000.000 byte TikTok và tối đa 8.000.000 byte Threads. Bảng xem chỉ ghi trong `_xem/`, không nằm trong `manifest.anh`.

Bộ hiện có gắn rõ **MẪU**, giá/link `example.com` chỉ để kiểm kỹ thuật. Phong cách còn chờ anh duyệt; chưa dùng làm bài đăng.

## Các lệnh thử cũ

```bash
tools/tiktok-anh.sh khung nguon/video.mp4 16
tools/tiktok-anh.sh bang nguon
tools/tiktok-anh.sh chu ra/video/khung-03.jpg ra/bo/1.jpg "Câu móc" tren
```

`chu` và `khung` giữ cách dựng cũ. `kiem`/`luoi` dùng chung bộ kiểm/đường dẫn với renderer mới.

## Dùng từ MCP

`tools/dung-bo-anh.mjs` export `ROOT`, `normalizeProduct(value)`, `safePath(value, area, {allowMissing})`, `readBrief(product)`, `validateCopy(data, brief)`, `checkImages(paths)`, `createPreview(paths)` và `renderSet(data, {browser, timeoutMs})`. `area` là `nguon` hoặc `ra`; mặc định file phải tồn tại. `renderSet` mặc định timeout 60 giây, mở Chromium khi được gọi, tự đóng browser do nó tạo; có thể nhận browser còn kết nối để dùng lại. Khi browser truyền vào đã sập, renderer mở bản thay thế cho lần dựng đó. Mỗi lần dựng có context riêng tắt JavaScript; lỗi/timeout dọn thư mục tạm. `fillPage` là hàm điền mẫu dùng chung với test trình duyệt.
