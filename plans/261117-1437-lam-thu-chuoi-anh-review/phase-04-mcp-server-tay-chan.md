---
phase: 4
title: "MCP server tay chân"
status: pending
priority: P1
dependencies: [2]
---

# Phase 4: MCP server tay chân

## Overview

Bọc các lệnh của repo thành MCP server chạy kiểu stdio, để MausBot thêm vào qua **Plugins → MCP servers → Add server → Run a command**. Server chỉ chạy lệnh, không tự gọi AI.

## Requirements

Các tool:

| Tool | Vào | Ra |
|---|---|---|
| `liet_ke_nguon` | tên sản phẩm (tùy chọn) | danh sách ảnh/video trong `nguon/` và brief |
| `bang_anh_nguon` | thư mục | đường dẫn `bang-nguon.jpg` (bot xem để chọn) |
| `lay_khung` | video, số khung | `bang-khung.jpg` và `khung.json` (tool này thêm khi phase 3 xong) |
| `dung_bo_anh` | JSON bộ ảnh như ở phase 2 | các ảnh, `bang-ket-qua.jpg`, kết quả kiểm |
| `kiem_anh` | danh sách ảnh | đạt hay không đạt, kèm lý do |

Ràng buộc:
- Đường dẫn chỉ được nằm trong `nguon/` và `ra/`. Chặn `..` và đường dẫn tuyệt đối ra ngoài repo.
- Lỗi phải trả về thành câu dễ hiểu, để bot tự sửa được.

## Architecture

- Node, dùng `@modelcontextprotocol/sdk`. Mỗi tool chỉ gọi lại lệnh đã có (`tiktok-anh.sh`, `dung-bo-anh.mjs`).
- Ảnh trả về dạng đường dẫn file. Bot đọc ảnh bằng công cụ đọc file của engine.

## Related Code Files

- Create: `mcp/server.mjs`.
- Modify: `package.json`, `README.md` (thêm lệnh gắn vào MausBot).

## Implementation Steps

1. Viết server với 4 tool (để `lay_khung` sau), giới hạn đường dẫn ở `nguon/` và `ra/`.
2. Kiểm bằng MCP Inspector (`npx @modelcontextprotocol/inspector`): gọi từng tool, gồm cả đường dẫn sai và đường dẫn cố thoát ra ngoài repo.
3. Gắn server vào **bản MausBot cô lập** và cho một bot gọi `dung_bo_anh` với JSON mẫu.

## Success Criteria

- [ ] Inspector liệt kê đủ tool; gọi thật ra ảnh đúng như chạy lệnh tay.
- [ ] Đường dẫn ngoài `nguon/` và `ra/` bị từ chối, kèm thông báo rõ.
- [ ] Bot trên bản cô lập dựng được một bộ ảnh qua MCP.

## Risk Assessment

- **Bot đọc được file ngoài phạm vi:** đã có lớp chặn đường dẫn; thêm test cho trường hợp này.
- **Dựng ảnh chậm** (Playwright khởi động): giữ một trình duyệt mở suốt đời của server.
