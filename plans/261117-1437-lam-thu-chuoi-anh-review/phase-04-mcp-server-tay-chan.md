---
phase: 4
title: MCP server tay chân
status: completed
priority: P1
dependencies:
  - 2
---

# Phase 4: MCP server tay chân

## Overview

Bọc các lệnh của repo thành MCP server chạy kiểu stdio, thêm vào MausBot qua **Plugins → MCP servers → Add server → Run a command**. Server không tự gọi AI. Riêng phần đăng bài thì dùng thẻ Postiz có sẵn của MausBot, không làm trong server này.

## Requirements

Các tool:

| Tool | Loại | Vào | Ra |
|---|---|---|---|
| `list_nguon` | đọc | tên sản phẩm (tùy chọn), `run_id` nếu đọc trạng thái | danh sách sản phẩm, ảnh, video; nội dung `brief.json` được bọc rõ là **dữ liệu**, cắt tối đa 2.000 ký tự; báo lỗi rõ nếu thiếu brief; trả `dang` của run để chống trùng |
| `view_bang_anh_nguon` | đọc | tên sản phẩm | bảng ảnh trả về **dạng ảnh MCP** (đã thu nhỏ), kèm đường dẫn tuyệt đối |
| `dung_bo_anh` | tạo | JSON bộ ảnh (phase 2) | `ra/<sp>/<run-id>/`, `manifest.json`, kết quả `kiem` từng ảnh, bảng xem dạng ảnh MCP |
| `tai_len_postiz` | tạo | `san_pham`, `run_id`, `kenh`, `caption`, `tieu_de?` (TikTok bắt buộc) | tải đúng các ảnh trong `manifest.json` lên `<POSTIZ_URL>/public/v1/upload`, trả `{anh:[{id,path}],dang,...}`, ghi tiến độ/hash vào `ra/<sp>/<run-id>/dang.json` |
| `ghi_dang` | tạo | các trường đăng ở trên, `trang_thai`, `postiz_id?` | ghi vào `dang.json`; nhận `dang_dang` trước đăng, `da_dang` kèm ID, `khong_ro` hoặc `that_bai`; không ghi đè ID hay mở khóa kết quả mơ hồ |
| `lay_khung` | tạo | video | thêm khi phase 3 xong |

Ràng buộc:

- **Kiểm dữ liệu vào:**
  - Mọi tool kiểm giá và link trong JSON phải **khớp nguyên văn** `brief.json`; sai thì từ chối.
  - Link phải thuộc danh sách domain thương hiệu ghi trong `brief.json`.
  - Caption kiểm theo kênh: Threads tối đa 500 ký tự; tiêu đề TikTok tối đa 90 ký tự.
- **Đường dẫn:**
  - Gốc repo tính từ `import.meta.url`.
  - Mọi lệnh con chạy bằng `execFile` với `cwd` là gốc repo, có `--` đứng trước tham số file.
  - Kiểm `realpath` cộng `path.relative` để chặn cả `..`, symlink và các tên kiểu `nguon-xau`.
- **Secret:**
  - API key của Postiz chỉ nằm trong biến môi trường của MCP server, khai trong MausBot.
  - Không trả key trong kết quả tool, không ghi vào log.
- **Môi trường chạy:** đặt rõ `PATH` và `PLAYWRIGHT_BROWSERS_PATH` trong biến môi trường của server.
- **Trình duyệt:**
  - Chỉ mở khi có lệnh đầu tiên, để không vượt khoảng 8 giây khởi động mà MausBot cho phép.
  - Trình duyệt sập thì mở lại; mỗi lần dựng có timeout.
  - Mỗi sản phẩm một khóa, để hai lần chạy không ghi đè nhau.
- **Thư viện:** ghim phiên bản `@modelcontextprotocol/sdk`; `npm audit --omit=dev` không còn lỗi mức high.

## Related Code Files

- Create:
  - `mcp/server.mjs`
  - `mcp/server.test.mjs`
- Modify:
  - `package.json`
  - `README.md` (thêm lệnh gắn vào MausBot, danh sách biến môi trường)

## Implementation Steps

1. Viết server với các tool trên (để `lay_khung` lại sau). Tool `tai_len_postiz` thử với `server/testing/fake-postiz.ts` của OpenMausBot hoặc một Postiz thử.
2. Test, tối thiểu gồm:
   - symlink trỏ ra ngoài repo;
   - `san_pham` có `../`;
   - tên file bắt đầu bằng `-`;
   - giá không khớp brief;
   - link ngoài danh sách domain;
   - caption Threads dài 600 ký tự;
   - gọi `tai_len_postiz` hai lần với cùng `run-id` (lần sau không tải lại).
3. Kiểm bằng `npx -y @modelcontextprotocol/inspector@<phiên bản ghim>`, chỉ nghe trên localhost.
4. Gắn server vào **bản MausBot cô lập** dùng engine giả có kịch bản, để chứng minh phần nối dây chạy đúng.

## Success Criteria

- [x] Inspector liệt kê đủ tool; gọi thật ra kết quả đúng như khi chạy lệnh tay.
- [x] Toàn bộ test ở bước 2 đạt.
- [x] Trên bản cô lập, engine giả gọi được `dung_bo_anh` và `tai_len_postiz` (tới Postiz giả).

## Risk Assessment

- **Bot đọc hoặc ghi ra ngoài phạm vi:** đã có `realpath`, chuẩn hóa tên và test. Lưu ý MCP không phải sandbox cho shell; giới hạn quyền shell là việc của mức duyệt Ask ở phase 6.
- **Đăng trùng:** `dang.json` cộng luật của bot ở phase 6.
- **Lộ key Postiz:** key chỉ ở biến môi trường, không trả trong kết quả tool.

## Kết quả — 17/11/2026

- Đã đọc cấu hình thật readonly ở phase 1: chưa có MCP/Postiz; phần thiếu là server tay chân. Thêm stdio 5 tool, dùng lại renderer/validation phase 2, không thêm tool đăng hay gọi AI. Hai tool đọc đổi tên theo quyết định anh duyệt trong plan; `lay_khung` còn chờ video/phase 3.
- `node --test mcp/server.test.mjs tests/mausbot-review.test.mjs`: **13/13**, khoảng 5 giây. Gồm symlink ra ngoài/prefix/traversal/tên ảnh `-`, giá/link/domain, caption Threads 600, TikTok 91, codepoint emoji, thumbnail MCP, manifest không chứa bảng xem/cross-run, hash bytes đổi, upload hai lần/restart không tải lại, partial progress, khóa xuyên server, crash nhả khóa, browser sập mở lại, clone mới chưa có `ra/` dựng được và `ra/` symlink bị chặn, timeout/redirect/key-echo không lộ credential, trạng thái/ID chống retry mù.
- Inspector **2.15.0** chạy CLI/stdio, không mở cổng. Lệnh thật đạt: `npx --no-install @modelcontextprotocol/inspector --cli --format json --quiet --method tools/list node mcp/server.mjs` (đủ 5 tool) và `... --method tools/call --tool-name list_nguon --tool-args-json '{}' node mcp/server.mjs`. Test còn gọi tool với sản phẩm fixture thật từ `/tmp`. Handshake dưới 8 giây, không launch Chromium lúc startup.
- Isolated `launchVerificationServer` từ source OpenMausBot `3cb89871f` (khác app đóng gói live 0.1.161): fake Claude gọi **thật** `dung_bo_anh` → `tai_len_postiz`, JPEG 1080x1920 đạt kiểm → fake upload loopback `/api/public/v1/upload`; gọi lại chỉ có **1 upload**. Thẻ Postiz dùng `startFakePostiz` gốc; backend này chưa có upload nên đứng riêng một stand-in upload loopback trong test repo, không sửa OpenMausBot. Bot được chọn mount đủ 2 server, bot khác mount **không server nào**. Key canary không xuất trong API answer/transcript/log. Tóm tắt và ảnh ở `ra/omb-670343/` (Git ignore); không chép credentials/config/log fixture vào repo. Không có bài đăng hay API trả phí.
- `dang.json` atomic rename, giữ từng ảnh upload thành công và một dấu đang chờ trước request; lỗi mơ hồ dừng để đối chiếu. Ghi `dang_dang` là bước nhận đăng độc quyền; lần nhận lại bị từ chối, `da_dang` giữ nguyên ID. Đây không thay thế việc bot dùng đúng thứ tự khi gọi thẻ Postiz.
- Môi trường server hướng dẫn rõ PATH và PLAYWRIGHT_BROWSERS_PATH tuyệt đối. Khóa kernel `flock` từ util-linux tự nhả sau crash, không xóa file lock của tiến trình khác. Upload HTTP chỉ cho loopback fixture, production phải HTTPS, cấm redirect, timeout 30 giây.
- Ghim SDK **1.32.2**, Zod **4.6.7**, Inspector **2.15.0** và lockfile; `npm audit --omit=dev`: **0 vulnerabilities**. Nguồn contract: [MCP SDK stdio](https://ts.sdk.modelcontextprotocol.io/server), [Postiz Public API auth](https://docs.postiz.com/public-api/introduction), [upload multipart/id/path](https://docs.postiz.com/public-api/uploads/upload-file), source controller v2.26.0 đã đối chiếu.
- `ck plan check 4 --start` và `ck plan check 4` thành công trong thư mục plan. CLI sửa nhầm Applied To Red Team #4; đã khôi phục nguyên `phase 1, 5, 6`, không sửa phần review/ngoại lệ cố định. Full gate chỉ chạy một lần sau review độc lập bởi phiên chính; phase 4 hoàn tất theo 3 tiêu chí trên, các phase/live acceptance khác vẫn giữ trạng thái thật.
