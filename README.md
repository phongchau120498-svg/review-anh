# review-anh

Làm series review dạng ảnh từ kho tư liệu sản phẩm, ưu tiên TikTok dọc **9:16, 1080x1920**, đồng thời kiểm chuẩn JPEG của Threads. MausBot gọi MCP của repo để chọn nguồn, dựng/kiểm ảnh và tải lên Postiz; đăng bài dùng thẻ Postiz có sẵn của MausBot.

## Cấu trúc

- `tools/dung-bo-anh.mjs`: dựng ảnh từ JSON và mẫu HTML; xuất manifest và bảng xem.
- `tools/tiktok-anh.sh`: trích khung, chèn chữ kiểu cũ, dựng bảng và kiểm ảnh.
- `mcp/server.mjs`: server stdio gồm 5 tool nguồn/dựng/upload/trạng thái, không tự gọi AI hay đăng bài.
- `mau/`: bìa và chi tiết, ảnh tràn viền với chữ trắng viền đen.
- `fonts/`: Be Vietnam Pro Regular/Bold, kèm giấy phép OFL 1.1; nguồn [Google Fonts](https://github.com/google/fonts/tree/main/ofl/bevietnampro).
- `nguon/<san-pham>/`: `brief.json`, ảnh/video và JSON bộ ảnh; **không vào Git**.
- `ra/<san-pham>/<run-id>/`: JPEG, `manifest.json`, `_xem/bang-ket-qua.jpg`; **không vào Git**. Chỉ ảnh trong manifest dùng để đăng.
- `docs/huong-lam.md`: kiến trúc và điều kiện đăng.
- `docs/huong-dan-thu-trinh-may-linux.md` và `tools/bang-nguon.sh`: quy trình Thu Trinh tự làm bản nháp khi mượn máy Linux (xem bảng nguồn theo trang, dựng, kiểm).
- `docs/kho-nguon.md` và `tools/drive-kho.sh`: cách xếp kho Drive Moaw Moaws vào `nguon/`, lấy thêm ảnh/khung video theo `drive_id`.

## Cài trên máy

Cần Node.js 22+, FFmpeg/ffprobe, ImageMagick 7 (`magick`) có decoder HEIC, util-linux (`flock`) và Gitleaks **8.30.1**. Kiểm cô lập MausBot bằng `npm test` cần Node.js 24+ và checkout OpenMausBot có dependencies ở thư mục anh em `../OpenMausBot`; test không sửa checkout đó. Lệnh chữ kiểu cũ dùng Noto Sans Bold hệ thống (đổi bằng `TIKTOK_ANH_FONT`).

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

Giá trong chữ hỗ trợ số có dấu phân cách `.`/`,`/khoảng trắng kèm `đ`, `đồng`, `₫`, `VNĐ`, `VND`, `k`, `nghìn`, `triệu`. Đoạn giá phải khớp nguyên văn brief. Link phải dùng URL HTTPS đầy đủ trong brief. Tool nhận ra cả tên miền ASCII viết trần và cho phép dấu câu sau URL đúng. Người duyệt vẫn kiểm giá viết bằng chữ hoặc số trần và các công dụng được nêu.

`kiem` báo đủ từng ảnh rồi trả mã lỗi chung. Tiêu chí gồm JPEG giải mã được toàn bộ, 1080x1920, sRGB, không profile/comment/metadata, dưới 20.000.000 byte TikTok và tối đa 8.000.000 byte Threads. Manifest giữ `anh` là danh sách đường dẫn ảnh đăng và ghi `kiem[].sha256` cho bytes đã kiểm lúc dựng. Bảng xem nằm riêng trong `_xem/`.

Bộ hiện có gắn rõ **MẪU**, giá/link `example.com` chỉ để kiểm kỹ thuật. Dùng brief thật cho lượt thử sản phẩm.

## Các lệnh thử cũ

```bash
tools/tiktok-anh.sh khung nguon/video.mp4 16
tools/tiktok-anh.sh bang nguon
tools/tiktok-anh.sh chu ra/video/khung-03.jpg ra/bo/1.jpg "Câu móc" tren
```

`chu` và `khung` giữ cách dựng cũ. `kiem`/`luoi` dùng chung bộ kiểm/đường dẫn với renderer mới.

## Dùng từ MCP

Trong **Plugins → MCP servers → Add server → Run a command**, đặt tên `review-anh`, executable Node và argument là đường dẫn tuyệt đối tới `mcp/server.mjs`. Với workspace hiện tại:

```json
{
  "mcpServers": {
    "review-anh": {
      "command": "/home/thanh-phong/.local/bin/node",
      "args": ["/home/thanh-phong/CTP DESKTOP/review-anh/mcp/server.mjs"],
      "env": {
        "PATH": "/home/thanh-phong/.local/bin:/usr/local/bin:/usr/bin:/bin",
        "PLAYWRIGHT_BROWSERS_PATH": "/home/thanh-phong/.cache/ms-playwright",
        "POSTIZ_URL": "https://postiz.example.com/api",
        "POSTIZ_API_KEY": ""
      }
    }
  }
}
```

Thay các đường dẫn khi chuyển máy; cài browser vào đúng `PLAYWRIGHT_BROWSERS_PATH`. Nhập key thật vào biến môi trường riêng của server trong MausBot, không chép vào file ví dụ hay argv. `POSTIZ_URL` là API base HTTPS **có `/api`** của Docker Postiz, tool nối thêm `/public/v1/upload`. Header upload dùng `Authorization: <key>` theo [Public API](https://docs.postiz.com/public-api/introduction); thẻ MCP Postiz của MausBot tự dùng Bearer. HTTP chỉ được chấp nhận cho loopback fixture. Không có key vẫn khởi động/liệt kê/dựng được; upload mới yêu cầu key.

**Trước khi nhập key/connect:** đặt bot thử ở Ask, chọn riêng `review-anh` và `postiz` cho bot đó; mọi bot khác dùng danh sách riêng không có hai server. Chỉ Always allow `list_nguon` và `view_bang_anh_nguon`. Xem [hướng dẫn bot](docs/huong-dan-bot.md) trước khi chạy thật.

| Tool | Dữ liệu vào chính | Kết quả |
|---|---|---|
| `list_nguon` | `{san_pham? ,run_id?}`; muốn đọc run phải có sản phẩm | Nguồn (tối đa 100), brief bọc dữ liệu/cắt rõ ở 2000 codepoint, 50 run gần nhất; thêm `dang` khi chỉ định run |
| `view_bang_anh_nguon` | `{san_pham, trang?}` | Bảng 40 ảnh mỗi trang (`trang` 1–10, kết quả có `so_trang`), thu nhỏ ≤1280px mỗi chiều dạng ảnh MCP; đường dẫn tuyệt đối và tên từng nguồn |
| `dung_bo_anh` | JSON bộ ảnh ở trên, trực tiếp `{san_pham,anh,gia?,link?}` | Manifest/checks và bảng xem MCP, đường dẫn tuyệt đối; dùng lại renderer |
| `tai_len_postiz` | `{san_pham,run_id,kenh,caption,tieu_de?}` | `{anh:[{id,path}],dang,...}`. `kenh` là `threads`/`tiktok`. TikTok cần `tieu_de` ≤90 đơn vị UTF-16 để Postiz không cắt. Threads caption ≤500 code point. |
| `ghi_dang` | Các trường đăng ở trên + `trang_thai`, `postiz_id?` | Ghi `dang_dang` **trước** gọi Postiz, `da_dang` + ID khi rõ thành công, hoặc `khong_ro`/`that_bai` |

Upload chỉ lấy `manifest.anh` trong đúng run và kiểm lại chuẩn ảnh lẫn SHA-256 từ lúc dựng. Nếu ảnh đã đổi hoặc manifest cũ chưa có SHA-256, dựng lại bộ ảnh và xin duyệt bảng xem mới trước khi tải. Mỗi ảnh upload thành công được ghi vào `dang.json` bằng atomic rename. Gọi lại sau thành công hoặc sau khi server restart trả cùng ID/link. Upload timeout, redirect, HTTP lỗi hoặc kết quả không hợp lệ giữ trạng thái đang chờ để đối chiếu. Mỗi upload timeout 30 giây. Tool không trả key hay nội dung lỗi gốc từ Postiz.

`ghi_dang` giữ nguyên ID và nội dung đã nhận đăng; `dang_dang`/`khong_ro` không được đặt lại để thử đăng. Khi mơ hồ, bot gọi `postsListTool` của thẻ Postiz để đối chiếu; xác nhận có bài thì ghi `da_dang` cùng ID, chưa rõ thì báo anh. Tool không tự đăng nên chống trùng còn phụ thuộc bot tuân thủ thứ tự này. Mỗi sản phẩm có khóa `flock` xuyên tiến trình; thao tác trùng báo đang bận, crash tự nhả khóa. Browser chỉ mở ở lệnh dựng đầu, sập thì mở lại; render có timeout 60 giây, launch tối đa 30 giây.

SDK **1.32.2**, Zod **4.6.7** và Inspector **2.15.0** ghim exact trong lockfile. Kiểm hẹp:

```bash
node --test mcp/server.test.mjs
node --test tests/mausbot-review.test.mjs
npx --no-install @modelcontextprotocol/inspector --cli --method tools/list node mcp/server.mjs
npx --no-install @modelcontextprotocol/inspector --cli --method tools/call --tool-name list_nguon --tool-args-json '{}' node mcp/server.mjs
```

Inspector dùng CLI/stdio, không mở public port. `npm test` là gate toàn repo (renderer + MCP + các fixture MausBot); mỗi fixture dùng home/data/port riêng, engine giả, Postiz giả và upload loopback, không đọc đăng nhập thật. Tóm tắt fixture nằm trong `ra/omb-<pid>/verification-summary.json`, bị Git ignore.

`tools/dung-bo-anh.mjs` export `ROOT`, `normalizeProduct(value)`, `safePath(value, area, {allowMissing})`, `readBrief(product)`, `validateCopy(data, brief)`, `checkImages(paths)`, `createPreview(paths)` và `renderSet(data, {browser, timeoutMs})`. `area` là `nguon` hoặc `ra`; mặc định file phải tồn tại. `renderSet` mặc định timeout 60 giây, mở Chromium khi được gọi, tự đóng browser do nó tạo; có thể nhận browser còn kết nối để dùng lại. Khi browser truyền vào đã sập, renderer mở bản thay thế cho lần dựng đó. Mỗi lần dựng có context riêng tắt JavaScript; lỗi/timeout dọn thư mục tạm. `fillPage` là hàm điền mẫu dùng chung với test trình duyệt.

## Chạy Postiz

Đã có [Docker Compose](postiz/docker-compose.yml) theo Postiz v2.26.0 chính thức, ghim mọi image bằng digest, chỉ mở `127.0.0.1:4007`; Postgres/Redis/Temporal/Elasticsearch không mở cổng ra máy. [Mẫu env](postiz/.env.example) chỉ có tên biến trống. `postiz/.env` và `postiz/data/` bị ignore; hook Gitleaks ở trên dùng chung cho phần này.

Làm theo [hướng dẫn Postiz local](docs/postiz-local.md) để anh tạo Cloudflare/domain/R2, named tunnel có Access chỉ email anh, app Threads/TikTok và kết nối kênh thử. **Chưa chạy container hoặc tunnel**: còn chờ tài khoản thử và domain. Sau khi anh tạo admin đầu tiên phải khóa đăng ký ngay; chỉ dùng bot thử ở mức Ask, thẻ Postiz có sẵn trong MausBot. Với Docker, địa chỉ server trên thẻ và `POSTIZ_URL` của công cụ upload là `https://postiz.<domain>/api`; thẻ tự thêm `/mcp`, upload thêm `/public/v1/upload`.
