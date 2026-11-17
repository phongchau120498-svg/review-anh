---
phase: 5
title: Postiz local và kết nối kênh
status: in-progress
priority: P1
dependencies: []
---

# Phase 5: Postiz local và kết nối kênh

## Overview

Chạy Postiz local bằng Docker Compose, có HTTPS cố định qua tunnel riêng có tên (named tunnel), ảnh lưu trên R2 gắn domain đã xác minh. Phase này chỉ kết nối **tài khoản Threads thử** và **tài khoản TikTok thử để riêng tư**, không đăng hay lên lịch gì trên tài khoản thật.

**Chặn bởi:** câu hỏi mở 2 (tài khoản thử) và 4 (Cloudflare và domain).

## Requirements

- **Chạy Postiz:**
  - Dùng file docker-compose chính thức, ghim phiên bản cụ thể, đặt `restart: unless-stopped`.
  - Postgres và Redis không mở cổng ra máy.
  - Bật Docker khi khởi động máy (`systemctl enable docker`).
- **Tunnel:**
  - Tạo named tunnel có route DNS trên domain của anh, cài thành dịch vụ (`cloudflared service install`).
  - Địa chỉ HTTPS này cố định. Dùng nó cho các biến địa chỉ của Postiz, cho các địa chỉ trả về sau đăng nhập (OAuth redirect) đã đăng ký với Meta và TikTok, và cho thẻ Postiz của MausBot (thẻ không nhận `http`).
- **Chặn truy cập từ ngoài:**
  - Đặt Cloudflare Access (chỉ email của anh) trước giao diện Postiz.
  - Docker đặt backend dưới `/api`: API công khai là `/api/public/v1/*`, MCP là `/api/mcp`, vẫn yêu cầu API key của Postiz. Thẻ có sẵn dùng địa chỉ `https://postiz.<domain>/api`, tự thêm `/mcp`. Kiểm thẻ có đi qua Access không; nếu không, chỉ nới các đường này, giữ đường con MCP chứa key trong URL sau Access theo hướng dẫn.
  - Bật `DISABLE_REGISTRATION=true` ngay sau khi tạo tài khoản đầu tiên.
- **Ảnh:**
  - Lưu trên R2, gắn custom domain, xác minh domain này trong app TikTok (vì TikTok chỉ kéo ảnh từ link, PULL_FROM_URL).
  - Dùng token R2 chỉ có quyền trên đúng bucket này, tách khỏi token của tunnel.
  - Tên file ngẫu nhiên; đặt quy tắc tự xóa các ảnh chưa đăng.
- **Secret:**
  - Chỉ nằm trong `postiz/.env`, đã gitignore.
  - Commit `postiz/.env.example` chỉ có tên biến; cần thêm `!postiz/.env.example` vào `.gitignore`, vì mẫu `.env*` hiện đang nuốt cả file này.
  - Thêm `postiz/data/` vào `.gitignore` **trước** lần `docker compose up` đầu tiên.
- **Quét secret:** cài gitleaks làm pre-commit hook của repo.

## Related Code Files

- Create:
  - `postiz/docker-compose.yml`
  - `postiz/.env.example`
  - `docs/postiz-local.md`
  - mục "Chạy Postiz" trong README
- Modify:
  - `.gitignore`: thêm `!postiz/.env.example` và `postiz/data/`
- Reuse: `.githooks/pre-commit` Gitleaks 8.30.1 của phase 2; không tạo hook khác.

## Implementation Steps

1. Cài `cloudflared` nếu phase 1 báo thiếu; dùng Gitleaks/hook và quy tắc ignore đã cài ở phase 2.
2. **Anh làm** (em viết sẵn từng bước bấm):
   - gắn domain vào Cloudflare;
   - tạo bucket R2 và custom domain;
   - tạo named tunnel và chính sách Access;
   - tạo app Meta có quyền Threads publish, thêm tài khoản Threads thử làm tester;
   - tạo app TikTok có Content Posting API, xác minh domain R2;
   - nộp hồ sơ duyệt app TikTok.
3. Điền `.env`, chạy `docker compose up -d`, tạo tài khoản admin, rồi bật `DISABLE_REGISTRATION`.
4. **Anh đăng nhập** tài khoản Threads thử và TikTok thử trong Postiz.
5. Kiểm truy cập: gọi `curl` không đăng nhập vào giao diện phải ra trang đăng nhập của Access, không ra giao diện Postiz.
6. Thử TikTok trên tài khoản thử để riêng tư:
   - tải 3 ảnh lên, đăng với `{content_posting_method: "DIRECT_POST", privacy_level: "SELF_ONLY", autoAddMusic: "yes"}`;
   - kiểm **trên chính app TikTok** rằng bài hiện riêng tư và có nhạc.
7. Thử Threads trên tài khoản thử: tải 3 ảnh lên rồi đăng một bài nhiều ảnh, kiểm trên app Threads.
8. Tạo API key của Postiz cho phase 6. Ghi ngày hết hạn của token Threads và TikTok vào mục kết quả.

## Success Criteria

- [ ] Postiz chạy qua HTTPS cố định; restart máy xong vẫn tự lên lại (Docker và tunnel đều là dịch vụ).
- [ ] Truy cập không đăng nhập bị Access chặn; không đăng ký được tài khoản mới.
- [x] `git ls-files postiz/.env.example` có file này; `postiz/.env` và `postiz/data/` không vào Git.
- [ ] Tài khoản TikTok thử có bài SELF_ONLY gồm 3 ảnh và nhạc; tài khoản Threads thử có bài 3 ảnh.

## Risk Assessment

- **TikTok từ chối domain hoặc tài khoản không để riêng tư:** kiểm trước khi đăng. Hồ sơ duyệt app không có hạn chắc chắn.
- **Đổi địa chỉ tunnel làm hỏng đăng nhập:** chỉ dùng named tunnel có địa chỉ cố định.
- **Lộ Postiz ra ngoài:** Access, tắt đăng ký, không mở cổng cơ sở dữ liệu.
- **Máy tắt làm token hết hạn hoặc lỡ giờ đăng:** chấp nhận trong lúc thử; đăng đều thì chuyển lên Dokploy.

## Kết quả chuẩn bị — 17/11/2026

**Đã xong phần không cần tài khoản:**

- Compose từ upstream `gitroomhq/postiz-docker-compose@dd4969e5e694cd009619a0d53cff14c21104580b`, Postiz v2.26.0; giữ 6 dịch vụ bắt buộc cùng healthcheck và dependency Temporal. Ghim 6 digest đã kiểm tồn tại qua manifest GHCR/Docker Hub; không pull image hoặc chạy container. Tất cả `restart: unless-stopped`, chỉ bind Postiz loopback 4007; không có cổng dữ liệu publish.
- `cloudflared --version`: **2026.11.0**, cài user-local từ release chính thức sau khi SHA-256 khớp `51f7c68b57ed7269164075d7e789efce5b59355982f06392deeb037d982a51fd`. Không chạy lệnh cài/bật dịch vụ tunnel hoặc thay đổi dịch vụ Docker.
- `docker compose ... config -q` với env giả trong `/tmp`, hostname `example.invalid`: **exit 0**; dùng mẫu env rỗng: **exit 1** vì biến bắt buộc chưa điền. Không thêm test mô phỏng lại compose.
- `git diff --check`: **exit 0**. `git check-ignore -v postiz/.env postiz/data/check` khớp `.env*`/`postiz/data/`; `git check-ignore -q postiz/.env.example`: **exit 1**, mẫu không bị ignore. Gitleaks quét bản sao 3 file prep trong `/tmp`: **0 leak**, exit 0. Hook `.githooks/pre-commit` dùng chung từ phase 2.
- [Hướng dẫn từng bước anh làm](../../docs/postiz-local.md) đã có domain/R2/token chỉ bucket/named tunnel/Access/Meta/TikTok/domain verification/đăng nhập kênh/thẻ Postiz sẵn có. Đã đối chiếu source v2.26.0: `DISABLE_REGISTRATION=true` vẫn cho LOCAL tạo tổ chức đầu tiên rồi chặn, có ngoại lệ generic OAuth; giữ trình tự anh tạo admin rồi khóa ngay, không bật generic OAuth.

**Còn chặn, phase giữ in-progress:** câu hỏi 2 và 4 chưa có tài khoản thử/Cloudflare/domain; chưa điền credentials, tạo tài nguyên, `up`, đăng nhập, connect, đăng/lên lịch, kiểm Access/API/MCP thật hoặc restart. Token/bài thật chưa có nên chưa ghi ngày hết hạn hay ID bài.

Tiêu chí tự xóa riêng ảnh chưa đăng cũng chưa xong: R2 lifecycle chỉ lọc tuổi/prefix, Postiz đặt key ngẫu nhiên tại root và không biết trạng thái đăng từ R2. Cần anh chốt cách nhận diện/thời gian lưu sau khi có tài khoản; không tự bật rule xóa cả bucket, không thêm code dọn ảnh.
