---
phase: 1
title: "Script giao việc"
status: completed
priority: P1
dependencies: []
effort: "2h"
---

# Phase 1: Script giao việc

## Overview

Viết `tools/giao-viec.sh <sp> [ghi-chu]`. Script chạy Claude Code headless trong repo, giới hạn quyền, để nó dựng trọn một bộ ảnh nháp. Kết quả là một khối JSON ngắn để Thu Trinh đọc.

## Requirements

- Chạy: `tools/giao-viec.sh body-oil "ghi chú tùy chọn của anh"`.
- Kiểm trước khi gọi model: `<sp>` khớp `^[a-z0-9-]+$`, có `nguon/<sp>/brief.json`. Thiếu brief thì thoát mã ≠ 0 kèm thông báo ngắn và không gọi model.
- Gọi `claude -p` với:
  - `--allowedTools` chỉ gồm: `Read`, `Glob`, `Grep`, `Write(nguon/<sp>/bo-anh.json)`, `Edit(nguon/<sp>/bo-anh.json)`, `Bash(tools/bang-nguon.sh:*)`, `Bash(node tools/dung-bo-anh.mjs:*)`, `Bash(tools/tiktok-anh.sh kiem:*)`.
  - `--disallowedTools` cho `WebFetch`, `WebSearch`, `Bash(git:*)`, `Bash(curl:*)`, `Bash(rm:*)`.
  - `--permission-mode dontAsk` (hoặc mode tương đương của bản 2.1.327, kiểm bằng `claude --help`) để lệnh ngoài danh sách bị từ chối, không treo chờ hỏi.
  - `--max-turns` có giới hạn, và `timeout 840` bọc ngoài để luôn trả về trước 900 giây.
  - Prompt cố định, nằm trong script: quy tắc chọn ảnh, lấy từ bước 2–4 của [hướng dẫn](../../docs/huong-dan-thu-trinh-may-linux.md). Giọng văn: khách review chân thật, không kê công dụng kiểu PR, giữ nhẹ brand. Ghi chú của anh nối vào cuối prompt dưới dạng dữ liệu.
- Output stdout là một khối JSON duy nhất: `{ok, run_id, bang_xem, anh:[...], ly_do:[...], caption:{threads, tiktok}, loi?}`. Đường dẫn ảnh là đường dẫn tương đối trong `ra/`. Log dài ghi vào `ra/<sp>/<run_id>/_xem/giao-viec.log`, không in ra stdout.
- Mỗi file ảnh trả về phải ≤ 2 MiB và có một link (để `read_file` gửi được). Ảnh nào vượt thì nén lại (ImageMagick đã có sẵn), ghi bản nén vào `_xem/`.

## Architecture

Script bash mỏng, không cần thư viện mới. Claude Code tự xem ảnh bằng `Read`, gồm bảng nguồn và ảnh gốc. Hardlink không ảnh hưởng gì khi đọc cục bộ.

## Related Code Files

- Create: `tools/giao-viec.sh`
- Create: `tools/giao-viec.test.sh` hoặc thêm ca vào test có sẵn (một check: thiếu brief → thoát ≠ 0, không gọi `claude`; dùng `PATH` giả có `claude` stub).

## Implementation Steps

1. Đọc `claude --help` bản 2.1.327, chốt tên cờ cho permission mode, allowed/disallowed tools, max-turns, output format.
2. Viết script: kiểm đầu vào, dựng prompt, gọi `timeout 840 claude -p ... --output-format json`, lấy phần `result` rồi in ra JSON tóm tắt.
3. Hậu kiểm bằng code, không tin model: mọi đường dẫn trong JSON nằm dưới `ra/<sp>/`, file tồn tại, ≤ 2 MiB, `nlink == 1`.
4. Viết test stub. Chạy `bash -n` và test.

## Success Criteria

- [x] Thiếu brief → thoát ≠ 0, có thông báo, không gọi model.
- [x] Claude từ chối lệnh ngoài danh sách rồi tiếp tục bằng lệnh hợp lệ.
- [x] Lượt thật với `san-pham-mau` trả JSON hợp lệ trong < 840 giây.

## Kết quả 18/11/2026

- `giao-viec.sh` gọi helper Node. `--tools` giới hạn công cụ và `dontAsk` từ chối mặc định. Hook `PreToolUse` cấp quyền cho từng lệnh và đường dẫn hợp lệ. Bubblewrap chạy ba lệnh dựng/kiểm với mạng bị tách, hệ thống file chỉ đọc và đích ghi giới hạn theo lệnh. Script xác minh lượt dựng từ manifest do renderer trả, rồi giữ mỗi file trả về ở tối đa 2 MiB và một hardlink.
- `time tools/giao-viec.sh san-pham-mau 'Đây chỉ là bài thử bố cục với hình tạo tại chỗ. Hãy dùng 3 ảnh và giữ chữ thật ngắn.'` chạy trong repo thử riêng với brief MẪU có sẵn và ảnh tổng hợp. Claude Code 2.1.327 dùng gói Claude và model `opus` đã chọn. **77,628 giây** từ lệnh đến JSON, gồm 3 JPEG, bảng xem và hai caption. Claude từ chối `ls` và lệnh ghép `sed … && node …`, sau đó chạy dựng và `kiem` thành công. Run `2026-11-18T09-28-14-167Z-683d09e5`. Claude ghi nhận chữ còn chạm nhẹ sản phẩm ở slide tổng hợp thứ ba.
- `bash -n tools/giao-viec.sh`, `node --check tools/giao-viec.mjs`, `node --test tools/dung-bo-anh.test.mjs` (8/8) và `node --test tools/giao-viec.test.mjs` (1/1) đạt. Test stub kiểm các nhánh brief thiếu, quyền, đường dẫn sai, timeout, ảnh nén và lượt dựng/kiểm thật trong sandbox.
- Sau review, hai watchdog giữ nhóm tiến trình của lệnh gọi và dùng PID namespace để dừng cả tiến trình con tách nhóm. Test gửi SIGKILL vào nhóm lệnh và thử timeout rút ngắn đều xác nhận tiến trình con nhả khóa. Chạy lại với môi trường tối giản như terminal mượn và ảnh tổng hợp, bản cuối trả 3 slide và bảng xem sau **43,466 giây**. Run `2026-11-18T09-45-20-982Z-c84d90f4`.

## Risk Assessment

- **Cú pháp cờ khác giữa các bản Claude Code:** kiểm `--help` trước, không đoán.
- **Model chạy quá lâu:** dùng `timeout` và `--max-turns`, nếu hết giờ thì vẫn in JSON `{ok:false, loi:"het-gio"}`.
- **Prompt injection từ brief hoặc tên file:** prompt ghi rõ đó là dữ liệu. Quyền đã khóa nên kể cả bị lừa cũng không ghi hay gửi ra ngoài được.
