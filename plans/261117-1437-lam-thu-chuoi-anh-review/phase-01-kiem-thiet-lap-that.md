---
phase: 1
title: "Kiểm thiết lập thật"
status: pending
priority: P1
dependencies: []
---

# Phase 1: Kiểm thiết lập thật

## Overview

Theo luật dự án: kiểm thiết lập thật trước khi code. Phase này chỉ đọc app thật. Các bước thử nghiệm làm trên bản cô lập, hoặc trên bot thử riêng mà anh đã duyệt.

## Requirements

- **Đọc cấu hình MausBot đang chạy:**
  - bot nào đang có;
  - engine và **mức duyệt** của từng bot;
  - mỗi bot đang gắn những MCP server nào;
  - **thẻ Postiz đã kết nối chưa**;
  - Tuyết Nhi đã được tạo chưa.
- **Kiểm engine bằng bot thử riêng** (ngoại lệ anh đã duyệt):
  - mỗi engine (Claude, Codex, Antigravity) có mô tả đúng được **một ảnh do tool MCP trả về** không;
  - Antigravity có mở được file video không.
  
  Bản cô lập chỉ có engine giả nên không làm được hai việc này.
- **Kiểm trên máy:** `docker`, `cloudflared`, `gitleaks`, và trạng thái đăng nhập của `claude`, `codex`, `agy`.

## Related Code Files

- Đọc trong OpenMausBot:
  - `docs/custom-mcp-servers.md`
  - `docs/approval-levels.md`
  - `docs/verification/README.md`
  - `docs/verification/postiz.md`
  - `server/auto-approve.ts`
- Ghi kết quả vào mục "Kết quả kiểm" ở cuối file này.

## Implementation Steps

1. Đọc cấu hình bot qua các chức năng đọc của MausBot (GET hoặc giao diện), không gọi API làm thay đổi gì.
2. Chuẩn bị bot thử riêng (gọi là "bot thử"):
   - mức duyệt **Ask**;
   - không gắn Postiz;
   - không có quyền tới dữ liệu đang vận hành.
3. Cho bot thử xem 2 ảnh và 1 video ngắn trong `nguon/`. Ghi lại engine nào mô tả đúng.
4. Chạy `--version` cho từng công cụ trên máy. Kiểm đăng nhập 3 CLI bằng lệnh status, không tốn lượt.
5. Ghi kết luận cho bước chọn ảnh: bot dùng bảng khung ảnh (mặc định) hay xem cả video, và engine nào dùng cho bot đăng bài.

## Success Criteria

- [ ] Có bảng ghi từng bot: engine, mức duyệt, MCP đang gắn, thẻ Postiz, tình trạng Tuyết Nhi.
- [ ] Có kết luận engine nào xem được ảnh từ tool MCP và video, kèm bằng chứng từ bot thử.
- [ ] Biết máy còn thiếu công cụ nào.

## Risk Assessment

- **Lỡ thay đổi bot đang vận hành:** chỉ đọc. Mọi thử nghiệm làm trên bot thử hoặc bản cô lập.
- **Chép thông tin đăng nhập engine vào bản cô lập:** **cấm**.

## Kết quả kiểm

Chưa chạy.
