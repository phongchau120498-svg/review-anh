---
phase: 4
title: "Vòng học từ duyệt"
status: pending
priority: P2
dependencies: [2]
---

# Phase 4: Vòng học từ duyệt

## Overview

Mỗi lần người dùng duyệt, sửa hay bỏ một bộ ảnh là một tín hiệu học. Nhưng lưu lại chưa phải là đã học (agentbook, agent-evolution). Phase này làm ba việc:
1. **Ghi** mỗi kết quả duyệt thành một dòng có cấu trúc, chỉ được thêm, không sửa;
2. **Đọc** các dòng gần nhất trước mỗi lượt viết;
3. **Đề xuất** sửa bộ brand khi một loại lỗi lặp lại, và chỉ sửa sau khi người dùng duyệt.

Ý này lấy từ viraloop (`learnings.json`) và slidelot (hàng chờ duyệt).

## Requirements

- Mỗi brand một file `docs/brand/<brand>/bai-hoc.md` (vào Git), chỉ thêm, không sửa dòng cũ.
- Mỗi dòng có đủ bốn yếu tố: **kết luận** (duyet | sua | bo), **loại lỗi**, **lý do**, **bằng chứng** (`run_id` có thật trong `ra/<sp>/`).
- Không ghi dữ liệu cá nhân hay khách hàng; lý do tối đa 300 ký tự, một dòng.
- Chỉ một chỗ ghi: script `tools/ghi-bai-hoc.mjs`. Agent không tự sửa tay file này.
- Đề xuất sửa brand là **bản sửa nhỏ** gửi người dùng xem; không tự áp dụng.

## Architecture

**Định dạng `bai-hoc.md`:**

```markdown
# Bài học <Brand>

| Mã | Ngày | Sản phẩm | run_id | Kết luận | Loại | Lý do |
|---|---|---|---|---|---|---|
| BH-20261120-1 | 2026-11-20 | body-oil | 2026-11-20T...-abcd1234 | sua | giong-van | Câu bìa nghe như quảng cáo |

## Đã đưa vào brand
- BH-20261120-1, BH-20261121-3 → giong-van.md mục "Moaw không là" (2026-11-22, anh duyệt)
```

**Lệnh ghi:**

```bash
node tools/ghi-bai-hoc.mjs <sp> <run_id> <duyet|sua|bo> <loai> "<lý do>"
```

`loai` thuộc tập: `giong-van`, `cau-cam`, `claim`, `chon-anh`, `chinh-ta`, `bo-cuc`, `khac`. Với `duyet`, loại có thể là `khac` và lý do là điều người dùng thích.

## Related Code Files

- Create: `tools/ghi-bai-hoc.mjs`, `tools/ghi-bai-hoc.test.mjs`, `docs/brand/moaw/bai-hoc.md` (tiêu đề và bảng rỗng)
- Modify:
  - `.claude/skills/lam-bo-anh/SKILL.md`: đọc bài học ở bước 1; ghi bài học và đề xuất sửa ở bước 6. Sửa **sau** phase 3.
  - `tools/giao-viec.mjs`: thêm `docs/brand/<brand>/bai-hoc.md` vào danh sách file đọc trong prompt bước 0. Quyền đọc đã có sẵn cho thư mục brand.
  - `docs/huong-dan-thu-trinh-may-linux.md`: sau khi anh duyệt hoặc chê trong chat, Thu Trinh chạy `ghi-bai-hoc` qua `run_command`.

## Implementation Steps

1. Viết `tools/ghi-bai-hoc.mjs`:
   - dùng `brandOf` của `tools/brand.mjs`;
   - kiểm đối số: mã sản phẩm hợp lệ; `run_id` khớp định dạng và có thư mục `ra/<sp>/<run_id>/`; kết luận và loại thuộc tập cho phép; lý do không rỗng và tối đa 300 ký tự;
   - thay `|` bằng `/` và xuống dòng bằng khoảng trắng;
   - sinh mã `BH-YYYYMMDD-n`, với n tăng theo số dòng cùng ngày;
   - thêm dòng vào cuối bảng, ngay trước mục `## Đã đưa vào brand`; dùng `flock` hoặc ghi file tạm rồi đổi tên để không hỏng file khi hai lệnh ghi cùng lúc;
   - in JSON `{ ok, ma }`.
2. Viết test: ghi hợp lệ; từ chối `run_id` không tồn tại, loại sai, lý do quá dài hoặc chứa `|`; hai lệnh ghi liền nhau ra 2 mã khác nhau; file chưa có thì tạo đúng khuôn.
3. Sửa `/lam-bo-anh`:
   - **Bước 1:** đọc 10 dòng mới nhất của `bai-hoc.md`, ưu tiên các dòng `sua` và `bo`.
   - **Bước 6:** khi người dùng trả lời duyệt, sửa hay bỏ, chạy `ghi-bai-hoc` (một lệnh mỗi lần trả lời).
   - Nếu có **≥ 2 dòng cùng loại lỗi** chưa nằm trong mục "Đã đưa vào brand", soạn **một** đề xuất sửa nhỏ cho file brand (trích dòng sẽ thêm hay sửa, kèm mã các bài học làm căn cứ) và hỏi người dùng. Chỉ khi được đồng ý mới sửa file brand và thêm một dòng vào mục "Đã đưa vào brand".
4. Sửa prompt `giao-viec` (bước 0) để đọc thêm `bai-hoc.md` của brand. Sửa hướng dẫn Thu Trinh: sau khi anh nhận xét, chạy `ghi-bai-hoc`; quy tắc ≥ 2 lỗi cùng loại thì báo anh.
5. Chạy test hẹp:
   ```bash
   node --test tools/ghi-bai-hoc.test.mjs tools/giao-viec.test.mjs
   ```

## Success Criteria

- [ ] Test hẹp đạt.
- [ ] Ghi thử một dòng bằng một `run_id` thật của Moaw thì `bai-hoc.md` đúng khuôn. Xóa dòng thử trước khi commit, hoặc giữ lại nếu đó là kết quả duyệt thật.
- [ ] `/lam-bo-anh` đọc bài học trước khi viết, ghi bài học sau khi người dùng trả lời, và chỉ đề xuất sửa brand khi đủ điều kiện.

## Risk Assessment

- **File bài học phình to.** Agent chỉ đọc 10 dòng mới nhất. Khi quá 200 dòng thì đề xuất chuyển phần cũ sang `bai-hoc-<năm>.md`. Ghi việc này thành nợ kỹ thuật, chưa làm.
- **Học sai từ một lần duyệt ngẫu nhiên.** Đặt ngưỡng ≥ 2 dòng cùng loại và bắt buộc người dùng duyệt trước khi sửa brand.
