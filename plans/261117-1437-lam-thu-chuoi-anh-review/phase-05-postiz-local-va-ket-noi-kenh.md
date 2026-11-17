---
phase: 5
title: "Postiz local và kết nối kênh"
status: pending
priority: P1
dependencies: []
---

# Phase 5: Postiz local và kết nối kênh

## Overview

Chạy Postiz local bằng Docker Compose. Ảnh lưu trên Cloudflare R2 có domain công khai. Dùng Cloudflare Tunnel để có HTTPS cho bước kết nối tài khoản. Kết nối Threads trước, rồi TikTok ở chế độ riêng tư.

## Requirements

- Postiz chạy bằng file docker-compose chính thức, ghim phiên bản cụ thể, không dùng `latest`.
- Ảnh lưu trên R2, gắn domain của anh. Đăng ký domain này trong app TikTok để TikTok kéo ảnh về được (PULL_FROM_URL).
- Tunnel cấp HTTPS cố định cho Postiz, dùng làm địa chỉ trả về sau khi đăng nhập (OAuth callback) cho Meta và TikTok.
- Secret (khóa R2, khóa app Meta, khóa app TikTok, JWT secret) chỉ nằm trong `.env` của Postiz, ngoài Git.
- Bật API công khai và MCP của Postiz, lấy API key để phase 6 dùng.

## Related Code Files

- Create: `postiz/docker-compose.yml` (bản ghim phiên bản), `postiz/.env.example` (chỉ tên biến, không có giá trị), một mục trong README.
- Modify: `.gitignore` thêm `postiz/.env` và `postiz/data/`.

## Implementation Steps

1. Cài Docker và `cloudflared` nếu phase 1 báo máy còn thiếu.
2. **Anh làm:**
   - tạo bucket R2 và domain;
   - tạo Tunnel;
   - tạo app Meta có quyền Threads publish;
   - tạo app TikTok có Content Posting API, rồi nộp hồ sơ duyệt.
   
   Em viết sẵn từng bước bấm để anh làm theo.
3. Điền `.env`, chạy `docker compose up -d`, mở Postiz qua địa chỉ HTTPS của tunnel.
4. **Anh đăng nhập** Threads và TikTok trong Postiz.
5. Thử TikTok: đăng 3 ảnh mẫu, chế độ SELF_ONLY, bật `auto_add_music`. Kiểm bài hiện riêng tư trong app và đã có nhạc.
6. Thử Threads: chỉ lên lịch một bài nháp rồi xóa, chưa đăng. Bài đăng thật để dành cho phase 6, sau khi anh duyệt.
7. Gọi thử API và MCP của Postiz bằng API key: liệt kê kênh, tạo một bài nháp.

## Success Criteria

- [ ] Postiz chạy local qua HTTPS. Restart máy xong vẫn lên lại.
- [ ] Kênh Threads và TikTok hiện "đã kết nối".
- [ ] Bài TikTok SELF_ONLY có 3 ảnh và nhạc tự gắn.
- [ ] MCP của Postiz trả về danh sách kênh khi gọi bằng API key.

## Risk Assessment

- **TikTok từ chối domain hoặc ảnh:** kiểm bước xác minh domain trước khi thử đăng.
- **Hồ sơ duyệt app TikTok lâu hoặc bị từ chối:** trong lúc chờ, TikTok vẫn chỉ riêng tư. Dự phòng: Postiz Cloud (trả phí, anh quyết).
- **Lộ secret:** chỉ commit `.env.example`; chạy kiểm secret trước mỗi commit.
- **Máy tắt lúc đến giờ đăng:** chấp nhận được trong giai đoạn thử. Khi đăng đều thì chuyển lên Dokploy.
