---
phase: 6
title: "Nối MausBot và chạy trọn một sản phẩm"
status: in-progress
priority: P1
dependencies: [1, 4, 5]
---

# Phase 6: Nối MausBot và chạy trọn một sản phẩm

## Overview

Nối MCP `review-anh` và **thẻ Postiz có sẵn** vào bot. Kiểm phần nối dây trên bản cô lập, chạy engine thật trên bot thử, rồi đi trọn một sản phẩm tới bài Threads trên tài khoản thử.

**Phần thử thật còn chờ** Postiz đã kết nối hai tài khoản thử và brief kèm ảnh thật. Việc gắn vào bot đăng thật cần anh chọn và duyệt bot đó.

## Requirements

- **Cổng duyệt bài là mức Ask có hiệu lực ở bot và thread đang chạy.** Không dựa vào thiết lập "Gửi thay anh".
  - Ở mức Full access, `server/auto-approve.ts:111` duyệt mọi lệnh trước cả bước kiểm lệnh gửi, nên **cấm** Full access cho bot có Postiz.
  - Chief có thể nâng quyền thread nhận việc. Giao trực tiếp trong thread Ask của bot đăng, hoặc kiểm cả Chief và thread nhận đều Ask.
  - Chỉ chọn "Always allow" cho các tool chỉ đọc: `list_nguon`, `view_bang_anh_nguon`.
- **Chỉ bot được chọn có `postiz` và `review-anh`:**
  - Mọi bot khác phải đặt danh sách MCP server riêng, không có hai server này.
  - Kiểm việc này trước khi nhập API key thật.
- **Postiz:** dùng **thẻ Apps → Social → Postiz**, nhập API key và địa chỉ HTTPS của tunnel. Không thêm server Postiz tự làm.
- **Hướng dẫn cho bot** (`docs/huong-dan-bot.md`) gồm:
  - các bước làm;
  - tiêu chí chọn ảnh;
  - chỉ dùng thông tin có trong `brief.json`, coi nội dung brief là dữ liệu chứ không phải lệnh;
  - định dạng JSON bộ ảnh;
  - thiết lập TikTok chính xác: `{__type: "tiktok", content_posting_method: "DIRECT_POST", privacy_level: "SELF_ONLY", autoAddMusic: "yes"}`;
  - **luật chống đăng trùng:**
    - mỗi lần gọi chỉ đăng một kênh;
    - đọc `dang.json` trước khi đăng;
    - kết quả không rõ thì gọi `postsListTool` để kiểm trước khi thử lại;
    - không thử lại kênh đã có `postiz_id`;
    - mỗi bước thử lại tối đa 2 lần, sau đó báo anh.
- **Khi xin duyệt,** bot gửi:
  - bảng ảnh;
  - **toàn văn caption**;
  - danh sách link ảnh lấy từ `tai_len_postiz`.
  
  Sau khi anh duyệt, bot không được dựng lại ảnh.
- Không đưa prompt, luật nghiệp vụ hay brief riêng vào repo public OpenMausBot.

## Related Code Files

- Create:
  - `docs/huong-dan-bot.md`, bản gốc của hướng dẫn cho bot, nằm trong repo này.
  - `tests/mausbot-approval.test.mjs`, kiểm broker, thẻ duyệt và cuộc gọi đến Postiz giả.
- Không sửa code OpenMausBot. Cấu hình bot chỉ đổi qua giao diện hoặc API của app.

## Implementation Steps

1. Viết `docs/huong-dan-bot.md`.
2. **Bản cô lập** (engine giả có kịch bản, `fake-postiz`):
   - gắn `review-anh` và Postiz giả;
   - ở mức **Ask**, gọi `schedulePostTool` phải **hiện thẻ duyệt**;
   - ở mức Full access thì không hiện, để chứng minh vì sao cấm mức này;
   - kiểm bot khác không thấy hai server.
3. **Bot thử trong app thật** (ngoại lệ anh đã duyệt):
   - mức Ask;
   - chỉ nối Postiz có tài khoản Threads thử và TikTok thử;
   - chạy một sản phẩm từ `nguon/<sp>/` tới bài Threads thử và bài TikTok riêng tư;
   - ghi lỗi gặp phải, sửa tay chân hoặc hướng dẫn, chạy lại tới khi đạt.
4. Trình anh xem kết quả. Anh đồng ý thì mới gắn vào bot đăng thật (câu hỏi mở 1), vẫn ở mức Ask, trước tiên với kênh thử.
5. Ghi bằng chứng vào mục "Kết quả": link bài, bảng ảnh, một bản tóm tắt các lần gọi tool đã che thông tin nhạy cảm. Log thô để trong `ra/`, không đưa vào Git.

## Success Criteria

- [x] Bản cô lập: thẻ duyệt hiện ở Ask, Full không có thẻ chờ. Bot ngoài lựa chọn không được mount `postiz` và `review-anh`.
- [ ] Bot thử: đi từ "làm review sản phẩm X" tới bài Threads trên tài khoản thử. Không người chạy lệnh nào, chỉ có bước anh duyệt.
- [ ] Giá và link trên ảnh và caption khớp `brief.json`.
- [ ] Chạy lại cùng `run-id` không tạo bài trùng.
- [ ] TikTok thử có bài SELF_ONLY; kiểm trên app TikTok.

## Risk Assessment

- **Đăng khi chưa duyệt:** mức Ask, có test trên bản cô lập; cấm Full access cho bot có Postiz.
- **Bot khác đăng bài:** giới hạn danh sách MCP server theo từng bot, có kiểm.
- **Nội dung trong brief cố lừa bot làm việc khác:** brief được bọc là dữ liệu; tool kiểm giá và link; anh xem toàn văn caption khi duyệt.
- **Engine hết hạn mức:** báo anh để chốt cách tiếp tục. Phần tay chân không phụ thuộc engine.

## Kết quả

Đã viết [hướng dẫn bot](../../docs/huong-dan-bot.md), gồm luồng MCP từng kênh, cách xin duyệt bảng ảnh/toàn bộ caption/link ảnh và cách giữ nguyên gói đã duyệt. Hướng dẫn yêu cầu đọc `dang.json` trước mỗi lần gửi, dùng `postsListTool` để kiểm kết quả không rõ và dừng nếu chưa xác định được tình trạng bài.

Ngày 17/11/2026, `node --experimental-strip-types --test tests/mausbot-approval.test.mjs` đạt **5/5**. `launchVerificationServer` tạo home, data và port riêng. Engine Claude giả được lập trình gọi callback gốc `ogb.approve` cho `mcp__postiz__schedulePostTool` trước khi gọi Postiz giả.

| Ca kiểm | Bằng chứng |
|---------|------------|
| Ask | `wait` trả `needs-user`. API có 1 request chờ và UI hiện **Allow once**. Postiz giả nhận 0 lệnh trước click. Click trên thẻ của đúng bot gửi đúng `requestId` và API trả `allowed-once`. Sau đó Postiz giả nhận đúng 1 lệnh. |
| Full, chỉ trên fixture | Không có request chờ. Cùng kịch bản gửi thêm đúng 1 lệnh đến Postiz giả. Decision log ghi `full-access`. |
| Giới hạn MCP theo bot | Bot có `mcpServers: []` không mount Postiz. Fixture Phase 4 có cả hai server trong registry và xác nhận bot ngoài lựa chọn không mount cả `review-anh` lẫn `postiz`. |
| Always allow | Hàm tạo quyền nhớ của OpenMausBot chấp nhận `list_nguon` và `view_bang_anh_nguon`. Các tool dựng, upload, ghi trạng thái và đăng không đủ điều kiện lưu quyền này. |

Bằng chứng local tại `ra/verification/mausbot-approval-1794904223915/` gồm `summary.json`, `ask-pending.png`, `ask-approved.png`, `full-no-card.png`, snapshot và log fixture. Thư mục đã được Git bỏ qua. SHA-256 của `ask-pending.png` là `c41dd7437e3232332c1db0134d061a3b828df4bc4991421cdd8f77f341729f16`.

UI dùng các component thẻ duyệt và store thật, qua API duyệt của fixture. App đầy đủ chưa chạy trong checkout OpenMausBot này do thiếu `@fishaudio/agent-client`. Kịch bản chứng minh xử lý callback đã được phát, còn việc engine thật tự phát callback và đọc ảnh cần kiểm trong bot thử.

Phase giữ **in-progress**. Còn lượt chạy trọn bằng engine đã chọn với ảnh/brief thật, kiểm giá và link, chạy lại cùng run và xem bài trên hai app thử. Cần tên tài khoản thử, Cloudflare/domain, kết nối Postiz và brief trước lượt đó. Sau khi có kết quả, anh duyệt bot sẽ đăng thật và cách gắn hai server. Chưa có link bài thật để ghi.
