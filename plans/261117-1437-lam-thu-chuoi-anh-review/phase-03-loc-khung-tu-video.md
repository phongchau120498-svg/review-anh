---
phase: 3
title: "Lọc khung từ video"
status: pending
priority: P2
dependencies: []
---

# Phase 3: Lọc khung từ video

## Overview

Nâng lệnh `khung` từ chia đều theo thời lượng lên: đổi video HDR sang SDR, lấy khung theo chuyển cảnh, bỏ khung mờ, rồi ghép bảng để bot chọn. **Phase này chờ video của anh**; chưa có video thì làm phase khác trước.

## Requirements

- Nhận diện HDR bằng ffprobe (color transfer `arib-std-b67` hoặc `smpte2084`). Nếu là HDR thì chuyển một lần sang SDR BT.709 bằng `zscale` + tonemap hable, lưu cache. Ý này lấy từ Agent Edit (`docs/tham-khao-agent-edit.md`), tự viết lại, không chép code.
- Lấy 15–20 khung ứng viên theo chuyển cảnh. Nếu ít cảnh thì bù bằng cách chia đều.
- Loại khung mờ theo độ nét (độ lệch chuẩn sau bộ lọc Laplacian, đo bằng ImageMagick).
- Xuất `bang-khung.jpg` có đánh số, cùng `khung.json` ghi giây và độ nét của từng khung.

## Related Code Files

- Modify: `tools/tiktok-anh.sh`, lệnh `khung`.

## Implementation Steps

1. Viết hàm kiểm HDR và tạo bản SDR cache trong `ra/.cache/`.
2. Lọc chuyển cảnh: `select='gt(scene,0.3)'`, kèm giới hạn số khung tối đa.
3. Đo độ nét từng khung, bỏ 30% khung kém nhất; còn ít hơn 8 khung thì giữ lại.
4. Thử trên 2–3 video thật của anh, trong đó ít nhất 1 video iPhone HDR.

## Success Criteria

- [ ] Khung cắt từ video HDR có màu và độ sáng gần bản xem trên iPhone; anh so bằng mắt.
- [ ] `bang-khung.jpg` cùng `khung.json` có đủ 8–20 khung, không có khung mờ rõ rệt.

## Risk Assessment

- **Video quay một cảnh liền, ít chuyển cảnh:** lúc đó bù bằng cách chia đều.
- **ffmpeg không có `zscale`:** đã kiểm, máy có sẵn `zscale` và `tonemap`.
