---
phase: 3
title: "Chạy thử Body Oil"
status: pending
priority: P2
dependencies: [1, 2]
effort: "30m, cần anh có mặt"
---

# Phase 3: Chạy thử Body Oil

## Overview

Chạy trọn vòng thật từ chat của anh: Thu Trinh → `giao-viec.sh` → Claude Code → ảnh về chat.

## Requirements

- Anh chốt ngày 19/11 đây là review trải nghiệm. Dùng ý anh đã kể trong chat và ảnh Body Oil, bỏ giá và link mua hàng. Nếu anh chưa kể cảm nhận, bám chi tiết quan sát được trong ảnh.
- Anh yêu cầu Thu Trinh đọc lại `docs/huong-dan-thu-trinh-may-linux.md` và giao "làm bộ ảnh review trải nghiệm Body Oil".

## Implementation Steps

1. Anh giao việc trong chat. Theo dõi `lending-activity.jsonl` (chỉ đọc tên tool và kết quả, không in `secret`).
2. Xác nhận ảnh hiện trong chat, rồi anh góp ý một lần để thử vòng sửa.
3. Ghi lỗi thật phát sinh vào hướng dẫn. Cập nhật HANDOFF.

## Success Criteria

- [ ] `bang-ket-qua.jpg` và ảnh từng slide hiện trong chat. Anh không thao tác file.
- [ ] Vòng góp ý → dựng lại chạy được.
- [ ] Thời gian một lượt < 900 giây. Ghi lại thời gian thật.

## Risk Assessment

- Nếu lượt chạy vượt 900 giây: chuyển `giao-viec.sh` sang chạy nền (`nohup`) kèm lệnh `tools/giao-viec.sh trang-thai <sp>` để Thu Trinh hỏi lại. Chỉ làm khi đo thực tế thấy cần.
- Nếu chất lượng chọn ảnh kém: chỉnh prompt trong script, không đổi kiến trúc.
