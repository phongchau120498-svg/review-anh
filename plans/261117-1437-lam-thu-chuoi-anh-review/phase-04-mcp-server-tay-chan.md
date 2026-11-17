---
phase: 4
title: "MCP server tay chân"
status: pending
priority: P1
dependencies: [2]
---

# Phase 4: MCP server tay chân

## Overview

Bọc các lệnh của repo thành MCP server chạy kiểu stdio, thêm vào MausBot qua **Plugins → MCP servers → Add server → Run a command**. Server không tự gọi AI. Riêng phần đăng bài thì dùng thẻ Postiz có sẵn của MausBot, không làm trong server này.

## Requirements

Các tool:

| Tool | Loại | Vào | Ra |
|---|---|---|---|
| `liet_ke_nguon` | đọc | tên sản phẩm (tùy chọn) | danh sách sản phẩm, ảnh, video; nội dung `brief.json` được bọc rõ là **dữ liệu**, cắt tối đa 2.000 ký tự; báo lỗi rõ nếu thiếu brief |
| `bang_anh_nguon` | đọc | tên sản phẩm | bảng ảnh trả về **dạng ảnh MCP** (đã thu nhỏ), kèm đường dẫn tuyệt đối |
| `dung_bo_anh` | tạo | JSON bộ ảnh (phase 2) | `ra/<sp>/<run-id>/`, `manifest.json`, kết quả `kiem` từng ảnh, bảng xem dạng ảnh MCP |
| `tai_len_postiz` | tạo | `run-id` | tải đúng các ảnh trong `manifest.json` lên `POST /public/v1/upload` của Postiz, trả về `[{id, path}]`, ghi kết quả vào `ra/<sp>/<run-id>/dang.json` |
| `ghi_dang` | tạo | `run-id`, kênh, `postiz_id`, trạng thái | ghi vào `dang.json`, để chạy lại thì không đăng trùng |
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

- [ ] Inspector liệt kê đủ tool; gọi thật ra kết quả đúng như khi chạy lệnh tay.
- [ ] Toàn bộ test ở bước 2 đạt.
- [ ] Trên bản cô lập, engine giả gọi được `dung_bo_anh` và `tai_len_postiz` (tới Postiz giả).

## Risk Assessment

- **Bot đọc hoặc ghi ra ngoài phạm vi:** đã có `realpath`, chuẩn hóa tên và test. Lưu ý MCP không phải sandbox cho shell; giới hạn quyền shell là việc của mức duyệt Ask ở phase 6.
- **Đăng trùng:** `dang.json` cộng luật của bot ở phase 6.
- **Lộ key Postiz:** key chỉ ở biến môi trường, không trả trong kết quả tool.
