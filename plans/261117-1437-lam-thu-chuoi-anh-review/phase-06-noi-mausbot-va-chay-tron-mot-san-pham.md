---
phase: 6
title: "Nối MausBot và chạy trọn một sản phẩm"
status: pending
priority: P1
dependencies: [1, 4, 5]
---

# Phase 6: Nối MausBot và chạy trọn một sản phẩm

## Overview

Gắn MCP `review-anh` và MCP Postiz vào bot được chọn, viết hướng dẫn làm việc cho bot, rồi chạy trọn một sản phẩm cho tới khi có bài Threads thật. Bài chỉ được đăng sau khi anh duyệt.

## Requirements

- Chạy đạt trên **bản MausBot cô lập** trước. Chỉ khi anh đồng ý mới gắn vào bot thật.
- Thiết lập "Gửi thay anh" của bot đặt ở **Hỏi mỗi lần**: bot phải hỏi, anh phải duyệt, rồi mới gọi lệnh đăng của Postiz.
- Hướng dẫn cho bot, đặt dưới dạng skill hoặc mục trong hồ sơ bot, gồm:
  - các bước làm;
  - tiêu chí chọn ảnh: nét, thấy rõ sản phẩm, mỗi ảnh một góc;
  - luật chữ: chỉ dùng thông tin có trong brief, không hứa hẹn ngoài brief;
  - định dạng JSON của bộ ảnh;
  - ghi lại ảnh đã dùng.
- Không đưa prompt, luật nghiệp vụ hay brief riêng vào repo public OpenMausBot.

## Related Code Files

- Create (trong repo này): `docs/huong-dan-bot.md`, bản gốc của hướng dẫn cho bot.
- Không sửa code OpenMausBot. Chỉ thay đổi cấu hình bot qua giao diện hoặc API của app, sau khi anh cho phép.

## Implementation Steps

1. Viết `docs/huong-dan-bot.md`.
2. Trên bản cô lập:
   - gắn 2 MCP;
   - tạo bot thử với engine chọn từ phase 1;
   - chạy một sản phẩm từ 3–4 ảnh trong `nguon/` cho tới bài nháp trong Postiz.
3. Ghi lại lỗi gặp phải và sửa phần tay chân hoặc hướng dẫn. Chạy lại tới khi đạt.
4. Trình anh xem kết quả bản cô lập. Anh đồng ý thì gắn vào bot thật, giữ thiết lập "Hỏi mỗi lần".
5. Chạy thật một sản phẩm. Bot gửi bảng ảnh và caption, anh duyệt trong chat, bot đăng Threads qua Postiz.
6. Ghi bằng chứng vào file này: link bài, ảnh bảng kết quả, log gọi tool. Không ghi token.

## Success Criteria

- [ ] Trên bản cô lập: bot tự đi từ "làm review sản phẩm X" tới bài nháp trong Postiz, không có bước người chạy lệnh.
- [ ] Trên bot thật: bot hỏi duyệt trước khi đăng; sau khi anh duyệt, bài Threads lên đúng ảnh và caption.
- [ ] TikTok: cùng bộ ảnh được bot đăng ở chế độ SELF_ONLY.

## Risk Assessment

- **Bot đăng khi chưa được duyệt:** dùng thiết lập "Hỏi mỗi lần" của MausBot (`docs/approval-levels.md`), không chỉ dựa vào lời dặn trong hướng dẫn. Kiểm trên bản cô lập trước.
- **Bot chọn ảnh kém hoặc viết sai sự thật:** buộc bot dùng brief, và anh duyệt bảng kết quả trước khi đăng.
- **Engine hết hạn mức giữa chừng:** cho phép đổi engine của bot; repo tay chân không phụ thuộc engine.

## Kết quả

Chưa chạy.
