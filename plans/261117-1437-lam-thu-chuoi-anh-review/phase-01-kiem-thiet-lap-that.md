---
phase: 1
title: "Kiểm thiết lập thật"
status: pending
priority: P1
dependencies: []
---

# Phase 1: Kiểm thiết lập thật

## Overview

Theo luật dự án: kiểm thiết lập thật trước khi code. Phase này chỉ đọc, không thay đổi gì trên app thật.

## Requirements

- Đọc cấu hình MausBot đang chạy:
  - các bot hiện có, nhất là Tiêu Băng;
  - engine từng bot dùng;
  - mức duyệt và thiết lập "Gửi thay anh";
  - các MCP server đã gắn;
  - Tuyết Nhi đã được tạo chưa.
- Kiểm engine Antigravity trong MausBot có mở được file video không. Dùng bản cô lập theo `docs/verification/README.md` của OpenMausBot.
- Kiểm trên máy:
  - CLI `claude`, `codex`, `agy` có đang đăng nhập không;
  - có Docker chưa;
  - có `cloudflared` chưa.

## Related Code Files

- Đọc: OpenMausBot `docs/custom-mcp-servers.md`, `docs/approval-levels.md`, `docs/verification/README.md`.
- Ghi kết quả vào mục "Kết quả kiểm" cuối file này.

## Implementation Steps

1. Đọc cấu hình bot qua chức năng đọc sẵn có của MausBot (API GET, giao diện). Không gọi API nào làm thay đổi.
2. Dựng một bản MausBot cô lập theo hướng dẫn verification, gửi một video ngắn cho một bot chạy engine Antigravity, xem bot có mô tả được nội dung video không.
3. Chạy `docker --version`, `cloudflared --version`, và kiểm trạng thái đăng nhập của 3 CLI (lệnh status hoặc một câu hỏi ngắn, không tốn nhiều lượt).
4. Ghi kết quả vào file này. Kết luận cho bước chọn ảnh: dùng video, hay chỉ dùng bảng khung ảnh.

## Success Criteria

- [ ] Có bảng: bot, engine, mức duyệt, MCP đã gắn, tình trạng Tuyết Nhi.
- [ ] Có kết luận Antigravity xem được video hay không, kèm bằng chứng từ bản cô lập.
- [ ] Biết máy còn thiếu công cụ gì (Docker, cloudflared…).

## Risk Assessment

- Lỡ tay thay đổi app thật. Cách tránh: chỉ đọc; mọi thử nghiệm làm trên bản cô lập.

## Kết quả kiểm

Chưa chạy.
