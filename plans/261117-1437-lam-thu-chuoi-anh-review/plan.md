---
title: Làm thử chuỗi ảnh review từ nguồn tới bài Threads
description: >-
  Một sản phẩm đi trọn: nguồn và brief → chọn ảnh → dựng ảnh → kiểm → tải lên
  Postiz → đăng Threads (và TikTok riêng tư), do bot MausBot điều khiển qua MCP
status: in-progress
priority: P2
branch: main
tags:
  - review-anh
  - mausbot
  - postiz
  - threads
  - tiktok
blockedBy: []
blocks: []
created: '2026-11-17T07:38:03.500Z'
createdBy: 'ck:plan'
source: skill
---

# Làm thử chuỗi ảnh review từ nguồn tới bài Threads

## Overview

Bản thử đầu tiên theo kiến trúc đã chốt trong [docs/huong-lam.md](../../docs/huong-lam.md):

- **Repo `review-anh`** chỉ làm tay chân: dựng ảnh từ mẫu HTML, kiểm chuẩn, tải ảnh lên Postiz. Các công cụ này được bọc thành MCP server.
- **Bot MausBot** làm bộ não: chọn ảnh, viết chữ từ brief, soát lại, rồi đăng qua **thẻ Postiz có sẵn của MausBot**.
- **Postiz** chạy local bằng Docker.
- **Kênh đăng:**
  - Threads làm trước.
  - TikTok đăng lên **một tài khoản thử để riêng tư**. Lý do: app TikTok chưa được duyệt chỉ cho đăng lên tài khoản đang để riêng tư, với chế độ SELF_ONLY.

## Tiêu chí nghiệm thu cả plan

- [ ] Một sản phẩm có `brief.json` đi hết chuỗi: chọn 3–4 ảnh → bộ ảnh 1080x1920 có chữ tiếng Việt, mọi giá và link khớp brief → qua bước kiểm → tải lên Postiz → bài Threads thật.
- [ ] Mọi bước do bot gọi qua MCP. Không có bước nào người phải chạy lệnh tay.
- [ ] **Bot đăng bài chạy ở mức duyệt Ask.** Có bằng chứng trên bản cô lập: lệnh đăng của Postiz làm hiện thẻ duyệt ở mức Ask, còn ở mức Full access thì không, nên Full access bị cấm cho bot này. Thiết lập "Gửi thay anh" **không** chặn được MCP Postiz, nên không dựa vào nó.
- [ ] Chỉ bot được chọn gắn `postiz` và `review-anh`. Mọi bot khác đã được loại hai server này khỏi danh sách.
- [ ] TikTok: tài khoản thử để riêng tư nhận được bài SELF_ONLY qua Postiz. Kiểm trên chính app TikTok, không tin trạng thái báo của Postiz.
- [x] Không có secret, ảnh nguồn, token hay log thô nào trong Git. Hook Gitleaks chạy trước mọi commit của lượt này.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Kiểm thiết lập thật](./phase-01-kiem-thiet-lap-that.md) | In Progress |
| 2 | [Mẫu HTML và dựng ảnh](./phase-02-mau-html-va-dung-anh.md) | Completed |
| 3 | [Lọc khung từ video](./phase-03-loc-khung-tu-video.md) | Pending |
| 4 | [MCP server tay chân](./phase-04-mcp-server-tay-chan.md) | Completed |
| 5 | [Postiz local và kết nối kênh](./phase-05-postiz-local-va-ket-noi-kenh.md) | In Progress |
| 6 | [Nối MausBot và chạy trọn một sản phẩm](./phase-06-noi-mausbot-va-chay-tron-mot-san-pham.md) | In Progress |

## Thứ tự và phụ thuộc

- **Phase 1** chạy trước.
- **Phase 2** chạy độc lập.
- **Phase 3** chờ video của anh và **không chặn nghiệm thu**, vì bản thử dùng ảnh tĩnh.
- **Phase 4** cần phase 2.
- **Phase 5** cần trả lời trước câu hỏi mở 2 và 4 (tài khoản thử, domain).
- **Phase 6** cần phase 1, 4, 5 và câu hỏi mở 1.

## Việc anh phải tự làm

- **Tài khoản và domain:** tạo tài khoản Cloudflare, gắn domain, tạo một tài khoản Threads thử và một tài khoản TikTok thử để riêng tư.
- **App nhà phát triển:** tạo app Meta (Threads) và app TikTok (Content Posting API); nộp hồ sơ duyệt app TikTok, việc này không có hạn chắc chắn.
- **Đăng nhập:** đăng nhập các kênh trong Postiz, rồi bấm Connect trên thẻ Postiz của MausBot.
- **Duyệt:** duyệt bài công khai đầu tiên, và duyệt việc gắn hai server vào bot thật.

## Ngoại lệ đã được anh duyệt (17/11/2026)

Phần chọn ảnh và viết chữ bằng engine thật được thử trên **một bot thử riêng trong app MausBot thật**. Điều kiện:

- bot ở mức Ask;
- chỉ nối Postiz có tài khoản Threads thử và TikTok thử;
- không đụng bot hay dữ liệu đang vận hành.

Phần nối dây và thẻ duyệt vẫn kiểm trên bản cô lập.

## Câu hỏi còn mở

1. Bot đăng thật về sau là bot nào: Tiêu Băng hay một nhân viên mới?
2. Tên tài khoản Threads thử và TikTok thử là gì? Phase 5 phải chờ câu này.
3. Phong cách và màu thương hiệu cho mẫu ảnh: anh gửi bài mẫu, hay em đề xuất 2–3 hướng?
4. Anh đã có tài khoản Cloudflare và domain chưa? Phase 5 phải chờ câu này.
5. Thông tin cho sản phẩm thử đầu tiên: tên, 3 điểm nổi bật, giá, link.

## Dependencies

Không có plan khác đang chạy trong repo này.

## Red Team Review

### Session — 2026-11-17

**Findings:** 15 sau khi gộp từ 39 phát hiện của 4 người soi (14 nhận, 1 bác).
**Severity breakdown:** 2 Critical, 10 High, 3 Medium.

Hai phát hiện Critical đã được tự kiểm lại trong mã nguồn OpenMausBot:

- `server/auto-approve.ts:111`: ở mức Full access, mọi lệnh được duyệt ngay, trước khi tới bước kiểm lệnh gửi ở dòng 113.
- `docs/verification/postiz.md`: MausBot đã có sẵn thẻ Postiz.

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | "Gửi thay anh" không chặn được lệnh đăng của Postiz; ở Full access bot đăng luôn không hỏi | Critical | Accept | plan, phase 6 |
| 2 | Không có bước đưa ảnh từ `ra/` lên Postiz | Critical | Accept | phase 4, 5, 6 |
| 3 | Bản cô lập chỉ có engine giả và vẫn nối tới Postiz thật | High | Accept (anh duyệt ngoại lệ bot thử) | plan, phase 1, 4, 6 |
| 4 | Plan làm lại thẻ Postiz mà MausBot đã có | High | Accept | phase 1, 5, 6 |
| 5 | Tunnel đưa toàn bộ Postiz ra internet | High | Accept | phase 5 |
| 6 | MCP gắn vào mọi bot chứ không riêng bot được chọn | High | Accept | plan, phase 6 |
| 7 | Chèn được mã vào HTML khi dựng ảnh, làm lộ file trên máy | High | Accept | phase 2 |
| 8 | Đường dẫn, thư mục làm việc, tên sản phẩm, `kiem` dừng ở lỗi đầu, bảng xem lẫn với ảnh đăng | High | Accept | phase 2, 4 |
| 9 | Chưa có brief nên bot tự bịa giá | High | Accept | phase 2, 4, 6 |
| 10 | TikTok khi app chưa duyệt bắt tài khoản phải để riêng tư; tên trường thiết lập sai | High | Accept (dùng tài khoản thử riêng tư theo lựa chọn của anh) | plan, phase 5, 6 |
| 11 | Chạy lại có thể đăng trùng; chưa kiểm giới hạn caption | High | Accept | phase 4, 6 |
| 12 | Phase 5 lên lịch thử Threads trên tài khoản thật | High | Accept | phase 5 |
| 13 | Bọc MCP là thừa, cho bot chạy script thẳng | Medium | Reject | — |
| 14 | Thiếu bước dựng tunnel, domain, tự chạy lại sau restart; chưa ghi phụ thuộc | Medium | Accept | plan, phase 5 |
| 15 | `.env.example` bị gitignore nuốt; thiếu công cụ quét secret; chưa ghim phiên bản | Medium | Accept | phase 2, 4, 5 |

**Lý do bác #13:**
- Bot đăng bài phải chạy ở mức Ask (theo #1). Ở mức đó mọi lệnh shell đều bật thẻ hỏi duyệt.
- MCP cho phép "Always allow" với các tool chỉ đọc (`docs/approval-levels.md`), nên đỡ phiền hơn.
- Đây cũng là hướng anh đã chốt.

**Đề xuất đã bác:** "Chỉ cho bot tạo nháp, anh tự bấm Publish trong Postiz". Cách này trái với quyết định "không đăng tay" của anh, và cách #1 đã đủ chặn.

### Whole-Plan Consistency Sweep

Đã rà lại plan.md và cả 6 file phase theo danh sách thay đổi bên dưới:

- **Mức duyệt:** thiết lập "Gửi thay anh" không còn được coi là cổng chặn. Cổng chặn là mức duyệt Ask.
- **Postiz:** "gắn MCP Postiz" được thay bằng "thẻ Postiz có sẵn".
- **Ảnh lên Postiz:** đã thêm `tai_len_postiz`.
- **Brief:** ví dụ JSON đổi sang `nguon/<sp>/` và có `brief.json`.
- **TikTok:**
  - tài khoản thử để riêng tư;
  - trường thiết lập của Postiz: `autoAddMusic: "yes"` và `content_posting_method: "DIRECT_POST"`;
  - bỏ tên trường `auto_add_music` của TikTok.
- **Phase 5:** không đăng hay lên lịch trên tài khoản thật.

Không còn mâu thuẫn chưa xử lý.

## Quyết định bổ sung — 17/11/2026

Anh duyệt đổi **chỉ tên** hai tool đọc: `liet_ke_nguon` → `list_nguon`, `bang_anh_nguon` → `view_bang_anh_nguon`. Chức năng giữ nguyên; bộ nhận diện tool đọc của MausBot chỉ nhận động từ tiếng Anh nên tên mới đủ điều kiện hiện Always allow. Các tool tạo giữ tên Việt. Đây là quyết định thêm sau review, không sửa lịch sử Red Team hay ngoại lệ bot thử đã chốt ở trên.

## Tracking

| Phiên | File đang giữ | Trạng thái / bằng chứng |
|---|---|---|
| `/root/verify_settings` | `phase-01-kiem-thiet-lap-that.md`; status/Tracking trong `plan.md` | Readonly local xong 17/11/2026: GET bots/MCP/Postiz/instances HTTP 200; version và auth status không tốn lượt. Chờ tài khoản thử, tư liệu/brief và kiểm engine; Cloud chưa kiểm. Chi tiết ở Kết quả kiểm phase 1. |
| `/root/render_images` | `phase-02`; `package*`; `mau/`; `fonts/`; `tools/dung-bo-anh*`; `tools/tiktok-anh.sh` (`kiem`, `luoi`); `README.md`; `.gitignore`; `.githooks/` | Đã hoàn tất phase 2 sau vòng góp ý. Bộ mẫu đã sửa ở `717e093`, dựng 3 ảnh đạt và test hẹp 8/8. Chi tiết ở Kết quả phase 2. |
| `/root/prepare_postiz` | `postiz/`; `docs/postiz-local.md`; mục Postiz trong `README.md`; `phase-05`; status/Tracking `plan.md` | Xong chuẩn bị local: Compose 6 dịch vụ ghim digest đã kiểm registry; config env giả exit 0, env trống bị chặn; cloudflared 2026.11.0 checksum đúng; gitleaks 0 leak, ignore/diff đạt. Chờ tài khoản/domain và chốt nhận diện/thời gian giữ ảnh chưa đăng; không up/bật dịch vụ/connect/đăng. Chi tiết Kết quả phase 5; nhả file sau commit. |
| `/root/mcp_tools` | `mcp/server*`; `tests/mausbot-review.test.mjs`; `package*`; mục MCP `README`; `phase-04`; chỉ 2 tên tool đọc trong `phase-06`; status/decision/Tracking `plan.md` | Phase 4 đủ 3 tiêu chí: `node --test mcp/server.test.mjs tests/mausbot-review.test.mjs` 13/13; Inspector 2.15.0 CLI list/call đạt; `npm audit --omit=dev` 0; fixture thật render→upload loopback, retry không tải lại, bot khác không mount cả 2 server. Không chạy full gate; chờ review độc lập + phiên chính kiểm chung. Commit riêng sau syntax/diff/Gitleaks; chưa push/deploy/live; ảnh/tóm tắt trong `ra/omb-670343/` (ignored). |
| `/root/verify_approvals` | `docs/huong-dan-bot.md`; `tests/mausbot-approval.test.mjs`; kết quả `phase-06`; status/Tracking `plan.md` | Guide và fixture xong, `node --experimental-strip-types --test tests/mausbot-approval.test.mjs` 5/5. Ask giữ 0 lệnh trước Allow once, 1 lệnh sau; Full không có thẻ chờ và thêm 1 lệnh tới Postiz giả. Kết quả và giới hạn UI/engine ở Phase 6. Commit riêng qua Gitleaks. Chờ review và gate chung, còn lượt bot thử với tài khoản/domain/brief thật. |

### Kiểm chung ngày 17/11/2026

- Review độc lập diff `906a324..d3a79f4` đối chiếu cả sáu phase và xem ảnh/thẻ duyệt thật từ fixture. Đã sửa sai lệch ảnh trước upload, giá/link trong chữ, giới hạn tiêu đề TikTok, JPEG cắt và stdout của `chu` trong `cb089fe`. Đã kiểm lại diff thay đổi hợp đồng manifest. Không còn lỗi Critical/High mở trong phần đã triển khai.
- `npm test` trên code `cb089fe`: **27/27 đạt**, exit 0, khoảng 7,2 giây. Gồm renderer, MCP/Inspector, MausBot cô lập dựng và upload lặp, thành phần thẻ Ask/Full và phạm vi MCP theo bot. `npm audit --omit=dev`: **0 vulnerabilities**. `ck plan validate`: **0 lỗi, 0 cảnh báo**. Kiểm cú pháp JS/shell và `git diff --check` đạt.
- `gitleaks git --log-opts='origin/main..HEAD' --redact --no-banner .`: quét 11 commit đến `cb089fe`, **không phát hiện secret**. Git chỉ track `postiz/.env.example`, không có `.env`, `postiz/data/`, `nguon/`, `ra/` hay log thô. Commit tài liệu chốt lượt đi qua cùng hook. Red Team Review và Ngoại lệ giữ nguyên nội dung.
- Commit theo phần: `2df5917` kiểm local, `9862c7e` dựng ảnh, `399abae` chuẩn bị Postiz, `9912a97` sửa thứ tự kiểm trước Connect, `ec71aa1` MCP, `d3a79f4` kiểm thẻ duyệt, `cb089fe` sửa theo review. Các phase đã nhả file. Chỉ cập nhật tài liệu sau lượt kiểm chung.
- **Phase 2 và 4 hoàn tất.** Phase 1 chờ kiểm engine trên bot thử. Phase 3 chờ video, không chặn thử ảnh tĩnh. Phase 5 chờ tài khoản thử, Cloudflare/domain và quyết định dọn ảnh chưa đăng. Phase 6 đã kiểm cô lập, còn chờ brief thật, lượt thử thật và duyệt trước khi gắn vào bot thật hoặc đăng công khai.
