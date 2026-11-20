---
phase: 5
title: "Skill thêm brand"
status: in-progress
priority: P3
dependencies: [1, 4]
---

# Phase 5: Skill thêm brand

## Overview

Biến `docs/them-brand-san-pham-nguon.md` thành lệnh `/them-brand`, theo cách `discover-brand` và `guideline-generation` của Anthropic: hỏi đủ thông tin, gom 5–20 bài mẫu thật, rút giọng văn theo cùng khung của Moaw, rồi tạo đủ bộ file brand. Skill **chỉ dẫn quy trình**, không thêm code.

## Requirements

- File hướng dẫn vẫn là nguồn chính. Skill trỏ tới các mục trong đó, không chép lại quy tắc.
- Tạo đủ bộ file: `thuong-hieu.md`, `giong-van.md`, `vi-du.md`, `cam.txt`, `bai-hoc.md`, `ca-thu.md` trong `docs/brand/<brand>/`, cùng `kho/<brand>.tsv` (chỉ dòng tiêu đề).
- Giọng văn chỉ rút từ bài thật của brand. Không chép giọng hay claim của Moaw. Thiếu thì ghi câu hỏi mở kèm khuyến nghị.
- Kết thúc bằng một lần soát: gọi agent `soat-bo-anh` ở chế độ soát khung brand, kiểm đủ mục, mọi ví dụ có nguồn, câu hỏi mở đều có khuyến nghị.

## Related Code Files

- Create: `.claude/skills/them-brand/SKILL.md`
- Modify: `docs/them-brand-san-pham-nguon.md` (bổ sung `vi-du.md`, `cam.txt`, `bai-hoc.md`, `ca-thu.md` vào cấu trúc và các bước; trỏ tới `/them-brand`), `.claude/agents/soat-bo-anh.md` (thêm chế độ "soát khung brand")

## Implementation Steps

1. Viết `.claude/skills/them-brand/SKILL.md`. Frontmatter `name: them-brand`; mô tả dùng khi người dùng nói "thêm brand", "tạo brand mới", `/them-brand`.
   - **Bước 1:** hỏi một lượt theo mục "Thêm brand mới" của file hướng dẫn.
   - **Bước 2:** đặt và kiểm mã brand (chữ thường, không trùng, khác `chung`).
   - **Bước 3:** gom bài mẫu. Ảnh slide thì xem bằng Read theo bảng ghép như đã làm với Moaw.
   - **Bước 4:** rút giọng văn theo đúng mục của `docs/brand/moaw/giong-van.md` (một câu, bảng là / không là, xưng hô, hook, tông theo chỗ đặt chữ, cấm tuyệt đối).
   - **Bước 5:** tạo đủ file; `bai-hoc.md` và `kho/<brand>.tsv` chỉ có phần đầu.
   - **Bước 6:** gọi agent soát khung brand.
   - **Bước 7:** ghi Knowledge (mục "Brand đang có") và Tracelog; báo người dùng các câu hỏi mở.
2. Cập nhật file hướng dẫn và agent soát như trong mục Related Code Files.
3. Chạy thử khô với một brand giả tên `thu`, bằng tài liệu mẫu tự soạn, trong thư mục tạm hoặc một nhánh. Kiểm tạo đủ file, rồi **xóa sạch**, không commit brand giả.

## Success Criteria

- [ ] `/them-brand` có mặt. Chạy thử khô tạo đủ 6 file brand cộng mục lục, và agent soát khung chấm "đạt" hoặc chỉ ra đúng chỗ thiếu.
- [x] Không còn dấu vết brand thử trong repo.
- [x] File hướng dẫn liệt kê đủ bộ file mới.

## Risk Assessment

- **Skill chép lại quy tắc rồi lệch dần với file hướng dẫn.** Skill chỉ trỏ tới mục, không chép.
- **Brand mới thiếu bài mẫu.** Dừng lại ở câu hỏi mở; không tự sáng tác giọng văn.
