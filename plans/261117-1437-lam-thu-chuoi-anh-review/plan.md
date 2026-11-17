---
title: "Làm thử chuỗi ảnh review từ nguồn tới bài Threads"
description: "Một sản phẩm đi trọn: nguồn → chọn khung → dựng ảnh → kiểm → Postiz đăng Threads, do bot MausBot điều khiển qua MCP"
status: pending
priority: P2
branch: "main"
tags: [review-anh, mausbot, postiz, threads, tiktok]
blockedBy: []
blocks: []
created: "2026-11-17T07:38:03.500Z"
createdBy: "ck:plan"
source: skill
---

# Làm thử chuỗi ảnh review từ nguồn tới bài Threads

## Overview

Bản thử đầu tiên theo kiến trúc đã chốt trong [docs/huong-lam.md](../../docs/huong-lam.md):

- Repo `review-anh` chỉ làm **tay chân**: lọc khung, dựng ảnh từ mẫu HTML, kiểm chuẩn. Các công cụ này được bọc thành MCP server.
- Bot MausBot làm **bộ não**: chọn ảnh, viết chữ, soát lại, rồi gọi Postiz qua MCP để đăng.
- **Postiz** chạy local bằng Docker. Threads làm trước. TikTok chỉ đăng riêng tư (SELF_ONLY) cho tới khi app của mình được TikTok duyệt.

## Tiêu chí nghiệm thu cả plan

- [ ] Một sản phẩm đi hết chuỗi: ảnh nguồn → 3–4 ảnh chọn → bộ ảnh 1080x1920 có chữ tiếng Việt → qua bước kiểm → bài Threads thật đăng qua Postiz.
- [ ] Mọi bước do bot MausBot gọi qua MCP. Không có bước nào người phải chạy lệnh tay.
- [ ] Bài công khai chỉ được đăng sau khi anh duyệt trong chat. Bot đặt "Gửi thay anh" ở mức **Hỏi mỗi lần**.
- [ ] TikTok đăng được một bài chế độ SELF_ONLY qua Postiz, có `auto_add_music`.
- [ ] Không thử thay đổi nào trên MausBot thật trước khi chạy đạt trên bản cô lập. Không có secret, ảnh nguồn hay token nào bị đưa vào Git.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Kiểm thiết lập thật](./phase-01-kiem-thiet-lap-that.md) | Pending |
| 2 | [Mẫu HTML và dựng ảnh](./phase-02-mau-html-va-dung-anh.md) | Pending |
| 3 | [Lọc khung từ video](./phase-03-loc-khung-tu-video.md) | Pending |
| 4 | [MCP server tay chân](./phase-04-mcp-server-tay-chan.md) | Pending |
| 5 | [Postiz local và kết nối kênh](./phase-05-postiz-local-va-ket-noi-kenh.md) | Pending |
| 6 | [Nối MausBot và chạy trọn một sản phẩm](./phase-06-noi-mausbot-va-chay-tron-mot-san-pham.md) | Pending |

## Thứ tự và phụ thuộc

- **Phase 1** chạy trước; nó quyết định một phần cách làm phase 4 và 6.
- **Phase 2, 3, 5** độc lập, chạy song song được:
  - phase 3 chờ video của anh, chưa có thì làm sau;
  - phase 5 cần anh tự đăng nhập tài khoản.
- **Phase 4** cần phase 2 xong. Phase 3 chưa xong thì tool lọc khung để sau.
- **Phase 6** cần phase 1, 4 và 5.

## Việc anh phải tự làm

Đây là các bước đăng nhập, tạo tài khoản, chấp nhận điều khoản. Em không làm thay được:

- Tạo tài khoản Cloudflare (R2 + Tunnel), tạo app Meta cho Threads, tạo app TikTok nhà phát triển và nộp hồ sơ duyệt.
- Đăng nhập Threads và TikTok trong Postiz.
- Duyệt bài công khai đầu tiên.

## Câu hỏi còn mở

1. Bot nào nhận việc: Tiêu Băng (đang lo Threads), hay một nhân viên mới riêng cho việc này?
2. Đăng thử lên tài khoản Threads chính hay một tài khoản thử? Threads không có chế độ riêng tư, bài nào đăng ra cũng công khai.
3. Phong cách và màu thương hiệu cho mẫu ảnh: anh gửi bài mẫu, hay để em đề xuất 2–3 hướng cho anh chọn?
4. Anh đã có tài khoản Cloudflare và domain chưa? TikTok yêu cầu ảnh nằm trên domain đã xác minh.

## Dependencies

Không có plan khác đang chạy trong repo này.
