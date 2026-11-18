---
phase: 2
title: "Sửa hướng dẫn Thu Trinh"
status: completed
priority: P2
dependencies: [1]
effort: "45m"
---

# Phase 2: Sửa hướng dẫn Thu Trinh

## Overview

Đổi [hướng dẫn](../../docs/huong-dan-thu-trinh-may-linux.md) từ "bot tự làm, anh kéo ảnh vào chat" sang "bot giao việc cho Claude Code rồi gửi ảnh vào chat".

## Requirements

- Mục "Quy trình một bộ ảnh":
  - Bước 1 (Brief) giữ nguyên: anh xác nhận giá và link xong mới ghi `brief.json`.
  - Bước 2–4 thay bằng: `shared_computer run_command` → `tools/giao-viec.sh <sp> "<ghi chú của anh>"`, `timeout_seconds: 900`.
  - Bước 5 (Trình anh): với mỗi ảnh trong JSON, gọi `shared_computer read_file` → ghi vào workspace → `attach_file`. Gửi `bang_xem` trước rồi tới từng ảnh. Kèm lý do và caption từ JSON.
  - Anh góp ý thì gọi lại `giao-viec.sh` với ghi chú mới. Không tự sửa `bo-anh.json` bằng tay.
- Xóa mục "Bot không tự xem được ảnh" và các chỗ `xdg-open`/"kéo ảnh vào chat" (đang dở chưa commit, thay luôn).
- Thêm lưu ý: không `read_file` ảnh trong `nguon/` (hardlink, sẽ bị từ chối). Chỉ gửi ảnh trong `ra/`.
- Mục "Không được làm" giữ nguyên. Thêm: không gọi `claude`/`codex` trực tiếp, chỉ qua `tools/giao-viec.sh`.

## Related Code Files

- Modify: `docs/huong-dan-thu-trinh-may-linux.md`

## Implementation Steps

1. Sửa các bước như trên, giữ văn phong ngắn của file.
2. `git diff --check`.
3. Soát các lệnh trong hướng dẫn khớp với script phase 1 (tên cờ, đường dẫn output).

## Success Criteria

- [x] Luồng chính giao việc rồi đính kèm ảnh vào chat.
- [x] Lệnh giao việc và đường dẫn đọc ảnh khớp với giao diện `tools/giao-viec.sh`.

## Kết quả 18/11/2026

- `git diff --check` và kiểm các ví dụ shell đạt. Thử ghi chú có dấu nháy, xuống dòng và ký tự shell qua `/bin/sh`, script nhận nguyên nội dung trong một đối số.
- Fixture cục bộ gọi `executeSharedOperation` của OpenMausBot bằng lệnh trong hướng dẫn. Thiếu brief Body Oil trả mã 1 và JSON `ok: false` trước khi gọi model. `read_file` đọc hướng dẫn, bảng và slide mẫu, giải mã base64 khớp SHA-256, từ chối ảnh nguồn có hardlink. Bước `attach_file` trong vòng Body Oil sẽ kiểm ở phase 3.
- Review đối chiếu Claude driver và `shared_computer`: mức Ask không bảo đảm có thẻ duyệt cho mỗi lời gọi máy mượn. Hướng dẫn giữ Ask và chỉ giao việc khi chính anh yêu cầu dựng hoặc sửa trong chat hiện tại. Ghi rõ giới hạn 8.000 ký tự của toàn bộ lệnh sau khi bọc nháy.

## Risk Assessment

Thu Trinh đã ghi nhớ quy trình cũ trong trí nhớ của nó. Phase 3 bắt đầu bằng lời nhắn mở đầu yêu cầu đọc lại hướng dẫn.
