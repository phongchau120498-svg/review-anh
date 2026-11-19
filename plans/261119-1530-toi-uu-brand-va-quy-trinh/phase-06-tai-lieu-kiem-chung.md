---
phase: 6
title: "Tài liệu và kiểm chung"
status: pending
priority: P1
dependencies: [1, 2, 3, 4, 5]
---

# Phase 6: Tài liệu và kiểm chung

## Overview

Cập nhật tài liệu cho khớp với phần đã làm, review độc lập một lượt và chạy gate đầy đủ một lần. Cách làm theo luật "giao cả plan" trong `~/.claude/rules/ck-workflow.md`: một review độc lập ở cuối, rồi gate đầy đủ.

## Related Code Files

- Modify:
  - `AGENTS.md`: mục "Làm content" thêm `soat-chu`, `bai-hoc.md`, `vi-du.md`; bản đồ tài liệu thêm `cam.txt` và `ca-thu.md`; nhắc `/them-brand`.
  - `docs/BLUEPRINT.md`: kiến trúc thêm bước soát máy, agent soát và vòng học.
  - `docs/protocols/ground-truth.md`, `knowledge-base.md` (thuật ngữ: cụm cấm, bài học, agent soát, ca thử), `tracking.md` (T-12 cho plan này với bằng chứng; cập nhật T-10), `tracelog.md` (mốc 19–20/11 và lý do chọn từng nguồn tham khảo), `security.md` (`bai-hoc.md` không chứa dữ liệu cá nhân).
  - `README.md`: thêm `soat-chu`, `ghi-bai-hoc`.
  - `HANDOFF.md`: khối của dòng việc này.

## Implementation Steps

1. Sửa các tài liệu trên. Mỗi thông tin chỉ nằm một chỗ chính, các chỗ khác trỏ tới đó (theo luật trong `AGENTS.md`).
2. Kiểm liên kết Markdown trong `AGENTS.md`, `docs/**/*.md`, `HANDOFF.md`: không còn liên kết gãy.
3. **Review độc lập.** Dùng một agent mới, ngữ cảnh sạch, không phải người đã viết các phase. Đưa cho agent đó:
   - diff của cả plan;
   - tiêu chí nghiệm thu trong `plan.md`;
   - rủi ro đã biết: bắt nhầm cụm cấm, luồng Thu Trinh, phình `bai-hoc.md`.

   Agent review kiểm cả các chỗ gọi tới phần bị sửa: `giao-viec`, `dung-bo-anh`, MCP. Lỗi Critical hoặc High thì sửa ngay và chạy lại test liên quan.
4. **Gate đầy đủ** (cần `../OpenMausBot`), kèm kiểm cú pháp:
   ```bash
   npm test
   node --check tools/*.mjs
   bash -n tools/*.sh
   git diff --check
   ```
5. Commit theo từng phase, message theo dạng conventional commits, không nhắc mã plan hay mã phát hiện. Hook Gitleaks phải chạy. **Không push** nếu anh chưa cho phép.

## Success Criteria

- [ ] Tài liệu khớp code. Không có liên kết gãy.
- [ ] Review độc lập không còn lỗi Critical hay High chưa xử lý.
- [ ] `npm test` đạt toàn bộ. Lệnh và kết quả thật ghi trong Tracking T-12.
- [ ] Working tree sạch sau commit. Chưa push nếu chưa được phép.

## Risk Assessment

- **`npm test` cần `../OpenMausBot` và profile AppArmor `unconfined`**, giống ngày 19/11. Lỗi môi trường thì ghi rõ trong Tracking, không bỏ qua test.
