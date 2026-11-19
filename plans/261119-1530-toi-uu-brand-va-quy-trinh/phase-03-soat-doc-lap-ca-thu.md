---
phase: 3
title: "Soát độc lập và ca thử"
status: pending
priority: P2
dependencies: [1, 2]
---

# Phase 3: Soát độc lập và ca thử

## Overview

Người viết không tự chấm bài của mình (agentbook: người kiểm phải độc lập với người làm; Anthropic dùng một agent soát riêng, chỉ đọc). Phase này thêm agent soát cho `/lam-bo-anh` và một bộ 3 ca thử. Mỗi khi sửa bộ brand thì chạy lại 3 ca này để biết giọng văn không bị tụt.

## Requirements

- Agent soát **chỉ đọc** (Read, Glob, Grep). Không sửa file, không chạy lệnh.
- Mỗi kết luận phải có **bằng chứng**: slide hay caption nào, trích đoạn nào, vi phạm dòng nào trong file brand. Bằng chứng không đủ thì ghi "không chắc", không chấm đạt.
- `/lam-bo-anh` sửa tối đa **2 vòng** theo kết quả soát. Sau đó vẫn trình, kèm các điểm còn lại.
- Luồng `giao-viec` (Claude Code chạy không giao diện, không gọi được agent con) **không** dùng agent soát. Luồng này dựa vào `soat-chu` cộng checklist tự soát. Ghi rõ giới hạn này trong tài liệu.

## Architecture

```text
/lam-bo-anh: viết → dựng → soat-chu (máy) → agent soat-bo-anh (đọc brand + bo-anh.json + caption + bang_xem)
             → không đạt: sửa và dựng lại (≤ 2 vòng) → trình người dùng
```

Agent soát trả về theo khuôn:

```text
KẾT LUẬN: đạt | chưa đạt | không chắc
VI PHẠM:
- [loại: giong-van|cau-cam|claim|chon-anh|chinh-ta|bo-cuc] chỗ: <anh[i].tieu_de|caption.threads|...> · trích: "<...>" · trái với: <file#mục> · sửa gợi ý: "<...>"
ĐIỂM TỐT (tối đa 2): ...
```

## Related Code Files

- Create: `.claude/agents/soat-bo-anh.md`, `docs/brand/moaw/ca-thu.md`
- Modify: `.claude/skills/lam-bo-anh/SKILL.md` (bước 5: chạy `soat-chu`, rồi gọi agent `soat-bo-anh`, vòng sửa)

## Implementation Steps

1. Tạo `.claude/agents/soat-bo-anh.md`. Frontmatter: `name: soat-bo-anh`, `tools: Read, Glob, Grep`, `model: haiku`. Theo câu hỏi mở 1 của plan, nếu ca thử cho thấy soát sót thì đổi sang `sonnet`.
   - Thân file: đọc `docs/brand/chung/cach-nghi-content.md` và `docs/brand/<brand>/{thuong-hieu,giong-van,vi-du}.md`, cộng 10 mục mới nhất của `bai-hoc.md` nếu đã có. Soát theo bảng "là / không là", "Tông theo chỗ đặt chữ", checklist tự soát.
   - Chỉ dùng thông tin trong các file đó; không tự suy ra claim. Trả đúng khuôn ở trên.
2. Sửa `SKILL.md` bước 5:
   - chạy `node tools/soat-chu.mjs nguon/<sp>/bo-anh.json`; có lỗi thì sửa trước;
   - gọi agent `soat-bo-anh`, đưa đường dẫn `bo-anh.json`, `bang_xem`, caption và brand;
   - vòng sửa tối đa 2 lần;
   - người dùng nói "nhanh" thì bỏ qua agent soát (câu hỏi mở 2).
3. Tạo `docs/brand/moaw/ca-thu.md` với 3 ca **phủ trường hợp biên**:
   - **Ca 1:** `body-oil`, ghi chú trải nghiệm "da bóng mịn sau tắm". Phải có cảm nhận bám ghi chú; không giá, không link.
   - **Ca 2:** `bot-thao-moc`, dạng nên/không nên, **không** có ghi chú. Phải dùng khung ❌/✓; không tự nhận đã dùng.
   - **Ca 3:** `love-oil`, ý tưởng mơ hồ "làm gì đó cho love oil". Phải đề xuất 2 góc và hỏi; không được tự dựng ngay.

   Mỗi ca ghi: đầu vào, phải có, không được có, cách kiểm (máy: `soat-chu`; người hoặc agent: `soat-bo-anh`), và chỗ ghi kết quả (Tracking).
4. Chạy thử 3 ca bằng `/lam-bo-anh` trong một phiên Claude Code. Ghi kết quả vào Tracking (task T-12 do phase 6 tạo): `run_id`, kết luận của `soat-chu` và agent soát, chỗ còn lệch.

## Success Criteria

- [ ] Agent `soat-bo-anh` có mặt, chỉ đọc, trả đúng khuôn.
- [ ] `/lam-bo-anh` chạy `soat-chu` rồi agent soát trước khi trình, có giới hạn 2 vòng.
- [ ] 3 ca thử chạy xong: ca 1 và 2 đạt `soat-chu`; ca 3 dừng lại hỏi. Kết quả ghi Tracking kèm `run_id`.

## Risk Assessment

- **Haiku soát kém giọng tiếng Việt.** Xem kết quả 3 ca. Soát sót rõ thì đổi model (câu hỏi mở 1), không viết thêm luật.
- **Tốn token.** Agent soát chỉ đọc các file cần thiết và 10 bài học gần nhất; có lối "nhanh".
