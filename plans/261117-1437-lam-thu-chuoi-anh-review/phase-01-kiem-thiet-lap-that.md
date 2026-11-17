---
phase: 1
title: Kiểm thiết lập thật
status: in-progress
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

- [x] Có bảng ghi từng bot trong workspace local đã kiểm: engine, mức duyệt, MCP đang gắn, thẻ Postiz, tình trạng Tuyết Nhi. Cloud chưa kiểm.
- [ ] Có kết luận engine nào xem được ảnh từ tool MCP và video, kèm bằng chứng từ bot thử.
- [x] Biết máy còn thiếu công cụ nào.

## Risk Assessment

- **Lỡ thay đổi bot đang vận hành:** chỉ đọc. Mọi thử nghiệm làm trên bot thử hoặc bản cô lập.
- **Chép thông tin đăng nhập engine vào bản cô lập:** **cấm**.

## Kết quả kiểm

Kiểm readonly ngày 17/11/2026, khoảng 14:50–14:57 (Asia/Ho_Chi_Minh). Chỉ kiểm workspace local tại `http://127.0.0.1:8799`, do app đóng gói OpenMausBot 0.1.161 đang chạy phục vụ; không suy rộng sang Cloud hay workspace khác.

### Thiết lập app thật

| Bot trong workspace local | Engine/model đã lưu | Mức duyệt | MCP do app quản lý | Thẻ Postiz |
|---|---|---|---|---|
| MausBot (Chief) | Claude / `claude-sonnet-5` | `full` (Full access); thread không ghi mức riêng nên theo bot | Registry toàn cục rỗng; bot không ghi danh sách riêng | `not-connected`, `keySaved=false`, mặc định Postiz Cloud |

- `GET /api/bots?messages=0` trả HTTP 200, đúng một bot MausBot. Không có Tiêu Băng/Tuyết Nhi trong workspace local này. **Chưa xác minh Tuyết Nhi trên Cloud**; không tạo lại bot.
- `GET /api/mcp/servers` trả HTTP 200 với `servers: []`. Đây chỉ là registry của app; chưa kiểm MCP của cấu hình CLI cá nhân hay `.mcp.json` dự án.
- `GET /api/postiz` trả HTTP 200 với trạng thái trên. Không gọi `check`, Connect hay tool Postiz.
- `GET /api/instances` trả HTTP 200: Claude và Codex `state=available`, `authenticated=true`; Antigravity `state=unavailable`. App báo Antigravity dùng runtime Google chính thức, cần **Install official Antigravity → Sign in with Google** và không sao chép login `agy` cũ. Chưa cài hay đăng nhập thêm.
- Đọc `AGENTS.md`, bốn tài liệu được chỉ định và `server/auto-approve.ts` của OpenMausBot: có sẵn thẻ Postiz; Full access tự duyệt trước nhánh chặn outbound. Bot local hiện tại **chưa đủ điều kiện làm bot đăng**. Giữ quyết định bot đăng phải Ask; chưa thay thiết lập thật.

Các GET được chạy bằng Python stdlib `urllib.request.urlopen` với timeout, chỉ in các trường cho phép (tên bot, engine, approval, registry, trạng thái kết nối); không lưu response đầy đủ, nội dung chat, log, token hay thông tin tài khoản.

### Công cụ và đăng nhập

| Lệnh đã chạy | Kết quả |
|---|---|
| `docker --version` | Docker 29.1.3, build `29.1.3-0ubuntu4.1`; chưa kiểm daemon/Compose |
| `command -v cloudflared` | Chưa cài |
| `gitleaks --version` | 8.30.1 |
| `claude --version` | Claude Code 2.1.326 |
| `codex --version` | codex-cli 0.169.0 |
| `agy --version` | 1.5.9 |
| `claude auth status --json` | Exit 0, `loggedIn=true`, `authMethod=claude.ai`; chỉ in trường trạng thái |
| `codex login status` | Exit 0, đã đăng nhập bằng ChatGPT; output được rút thành trạng thái |
| `agy --help` | CLI không có lệnh login/auth status; không chạy prompt để thử. Login `agy` cũ chưa xác minh; engine Antigravity trong app hiện unavailable như trên |

Đã đọc help trước khi gọi status; không chạy lượt AI và không đọc/xuất file credentials. `ss -ltnp` xác nhận app nghe ở loopback 8799; đối chiếu đường dẫn executable của PID để phân biệt app đóng gói với fixture.

### Phần chờ và kết luận

- Chưa tạo bot thử hay thử engine: còn thiếu tài khoản Threads/TikTok thử, ảnh/video và brief của anh. Không gọi engine thật, không đổi model/provider và không sao chép đăng nhập vào fixture.
- Khả năng đọc **ảnh do MCP trả về** của Claude/Codex/Antigravity và khả năng xem video của Antigravity **chưa có bằng chứng**. Giữ bảng khung ảnh làm hướng mặc định; chưa chọn engine đăng thay anh.
- Phase 1 giữ `in-progress` vì tiêu chí thử engine còn chờ. Phần dựng ảnh/MCP không phụ thuộc kết quả engine có thể tiếp tục; nối bot/đăng thật vẫn chờ điều kiện trong plan.

### Kiểm thay đổi tài liệu

- `ck plan check 1 --start`: thành công. CLI vô tình đổi cả ô Applied To của Red Team #1; đã khôi phục đúng `plan, phase 6`, không đổi quyết định review.
- `git diff --check`: đạt. `.git/hooks/pre-commit` chạy Gitleaks 8.30.1 trên đúng hai file staged: không phát hiện secret. Chỉ thay tài liệu nên không chạy test ứng dụng.
- Chỉ sửa trạng thái/kết quả trong plan; không sửa OpenMausBot, runtime hay cấu hình thật. Commit chỉ hai file plan thuộc phần kiểm này; không push/deploy.
