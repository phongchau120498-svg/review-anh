---
phase: 7
title: "Giảm vòng gọi và đo lường"
status: in-progress
priority: P1
dependencies: [2, 4]
---

# Phase 7: Giảm vòng gọi và đo lường

## Overview

Đo ngày 19/11 trên 4 lượt `giao-viec` dựng Body Oil (log ở `ra/body-oil/<run_id>/_xem/giao-viec.log`, model Opus 5.5):

| run_id (giờ) | Số vòng | Thời gian | Token đọc lại từ cache | Token viết ra | Quy ra giá API |
|---|---|---|---|---|---|
| 03:54 | 17 | 71 giây | 144 nghìn | 5,7 nghìn | $0,25 |
| 04:05 | 26 | 104 giây | 296 nghìn | 7,3 nghìn | $0,40 |
| 04:16 | 39 | 114 giây | 413 nghìn | 8,7 nghìn | $0,49 |
| 03:24 | 40 | 129 giây | 581 nghìn | 8,2 nghìn | $0,54 |

Nội dung cần đọc mỗi lượt chỉ khoảng 10–15 nghìn token:
- 3 file brand: khoảng 3,5 nghìn;
- mỗi trang bảng ảnh hoặc mỗi ảnh gốc: khoảng 1,5 nghìn.

Chi phí tăng theo **số vòng gọi tool**, vì vòng nào model cũng đọc lại cả ngữ cảnh. Phase này chuyển các việc có đúng/sai rõ ràng sang code để bớt vòng, và thêm phần đo tự động để biết kết quả. Đây là đường cơ sở để so sánh.

## Requirements

- Không đổi phần do agent quyết định: chọn góc, chọn ảnh, viết chữ, caption.
- **Model mặc định giữ nguyên.** Chỉ thêm tùy chọn đổi model, mặc định tắt (câu hỏi mở 5).
- Thông tin cố định đặt đầu prompt, theo thứ tự cố định; thông tin hay đổi (bài học, ghi chú của anh) đặt cuối, để tận dụng cache (agentbook, kv-cache-design).
- Không thêm phụ thuộc npm. Chấm ảnh dùng ImageMagick sẵn có.

## Architecture

```text
dong-bo        tải ảnh → sửa đuôi theo định dạng thật (tools/sua-duoi.sh) → hardlink
loc-anh        tools/loc-anh.mjs <sp>: chấm nét (độ lệch chuẩn sau lọc Laplacian), độ sáng trung bình,
               mã băm ảnh 8×8 để gộp ảnh gần trùng → cache nguon/<sp>/.cham-anh.json (theo mtime + size)
bang-nguon     tools/bang-nguon.sh <sp> [trang|--tat-ca]
               không có số trang: tạo mọi trang, in danh sách
               mặc định lọc: bỏ ảnh mờ/tối dưới ngưỡng, mỗi nhóm gần trùng giữ ảnh nét nhất
               --tat-ca: không lọc
dung-bo-anh    CLI trả thêm soat_chu (gọi soatChu của phase 2) bên cạnh kiem đã có
               → bỏ bước chạy tiktok-anh.sh kiem riêng trong prompt và skill
giao-viec      prompt: [luật cố định][chung/cach-nghi-content][<brand>/thuong-hieu][<brand>/giong-van]
               [<brand>/vi-du] … [10 bài học mới nhất][ghi chú của anh]
               → không còn bước Read file brand; tối đa 2 lần sửa và dựng lại
               đọc usage/num_turns/duration_ms/total_cost_usd từ JSON của claude
               → trả do_luong trong kết quả + thêm một dòng vào ra/_do-luong.tsv
               GIAO_VIEC_MODEL (tùy chọn): có thì truyền --model, không có thì giữ như cũ
```

## Related Code Files

- Create: `tools/sua-duoi.sh`, `tools/loc-anh.mjs`, `tools/loc-anh.test.mjs`
- Modify:
  - `tools/drive-kho.sh` (gọi `sua-duoi.sh` sau khi tải);
  - `tools/bang-nguon.sh` (tạo mọi trang, lọc, `--tat-ca`);
  - `tools/dung-bo-anh.mjs` (CLI thêm `soat_chu`) và test;
  - `tools/giao-viec.mjs` (ghép brand vào prompt, giới hạn vòng sửa, đo lường, `GIAO_VIEC_MODEL`, danh sách lệnh được phép theo cú pháp mới của `bang-nguon`), `tools/giao-viec.test.mjs` (stub `claude` trả `usage` mẫu);
  - `.claude/skills/lam-bo-anh/SKILL.md` (một lệnh bảng cho mọi trang; bỏ bước kiểm riêng; dùng `soat_chu` trong kết quả dựng; giới hạn 2 vòng).

## Implementation Steps

1. **`sua-duoi.sh <thư mục>`:** đổi đuôi theo `file -b --mime-type` giống cách đã làm tay ngày 18/11 (218 file). Trùng tên thì thêm `-doi`. In danh sách file đã đổi. `dong-bo` gọi lệnh này cho thư mục vừa tải và cập nhật đường dẫn `tai_ve` trong mục lục nếu tên đổi. Viết test với ảnh tổng hợp sai đuôi.
2. **`loc-anh.mjs`:**
   - Chấm từng ảnh:
     - `net`: độ lệch chuẩn sau lọc Laplacian, đo trên bản thu nhỏ 512 điểm ảnh;
     - `sang`: độ sáng trung bình, từ 0 đến 1;
     - `bam`: mã băm trung bình 8×8, dạng 64 bit.
   - Gộp ảnh gần trùng: khoảng cách Hamming ≤ 6.
   - **Đặt ngưỡng bằng dữ liệu thật** trên `nguon/body-oil` (92 ảnh), ghi lại trong file:
     - in phân bố điểm ra;
     - chọn ngưỡng sao cho chỉ loại ảnh thật sự mờ hoặc tối;
     - ghi số ảnh còn lại sau lọc;
     - **xem bằng mắt** bảng các ảnh bị loại để chắc là không loại nhầm ảnh đẹp.
   - Cache kết quả vào `nguon/<sp>/.cham-anh.json`, theo mtime và kích thước file.
   - Test với ảnh tổng hợp: ảnh nét và ảnh làm mờ; ảnh tối; hai ảnh gần giống (một ảnh dịch đi vài điểm ảnh).
3. **`bang-nguon.sh`:**
   - Không có số trang thì tạo mọi trang và in `đường_dẫn (trang i/n)` cho từng trang.
   - Mặc định lọc qua `loc-anh`; `--tat-ca` để xem toàn bộ.
   - Tên file trên bảng vẫn là tên thật.
   - Cập nhật danh sách lệnh được phép trong `giao-viec` và test tương ứng.
4. **`dung-bo-anh.mjs`:** CLI gọi `soatChu` sau khi dựng và trả thêm `soat_chu: {dat, loi, canh_bao}`. Chế độ trải nghiệm hay bán hàng theo cờ hiện có. Có lỗi soát chữ thì **vẫn dựng xong** nhưng báo `soat_chu.dat=false`, để agent sửa ở vòng sau. Test.
5. **`giao-viec.mjs`:**
   - Ghép nội dung các file brand vào đầu prompt theo thứ tự cố định, rồi tới 10 bài học mới nhất, cuối cùng là ghi chú của anh.
   - Bỏ bước 0 "Read file brand", nhưng giữ quyền đọc thư mục brand.
   - Prompt ghi rõ: dựng tối đa 3 lần (lần đầu cộng 2 lần sửa); không chạy lệnh kiểm riêng vì kết quả dựng đã có `kiem` và `soat_chu`; xem tất cả trang bảng bằng một lệnh.
   - Đọc `usage`, `num_turns`, `duration_ms`, `total_cost_usd`, `modelUsage` từ JSON của claude.
   - Trả thêm `do_luong: {model, so_vong, giay, token_vao, cache_ghi, cache_doc, token_ra, gia_api_usd}`.
   - Thêm một dòng vào `ra/_do-luong.tsv`, tạo dòng tiêu đề nếu file chưa có. Ghi file tạm rồi đổi tên, hoặc dùng `flock`.
   - `GIAO_VIEC_MODEL`: nếu có thì kiểm tên model khớp `^[a-z0-9.-]+$` rồi truyền `--model`.
   - Test: stub `claude` trả `usage` mẫu; kiểm `do_luong` và dòng TSV; tên model sai thì từ chối.
6. **`/lam-bo-anh`:** cập nhật bước 3 và bước 5 theo các lệnh mới. Ghi rõ trong skill: Claude Code trong phiên tương tác không tự đo được token, nên chỉ luồng `giao-viec` có đo lường.
7. **Đo lại:** chạy `tools/giao-viec.sh body-oil '<ghi chú của ca 1>'` 3 lần (giống luồng Thu Trinh, dùng model mặc định). So số vòng và token với bảng đường cơ sở ở đầu phase. Ghi vào Tracking T-12.

## Success Criteria

- [x] Test hẹp đạt:
  ```bash
  node --test tools/loc-anh.test.mjs tools/dung-bo-anh.test.mjs tools/giao-viec.test.mjs tools/soat-chu.test.mjs
  ```
  `bash -n` các script đạt.
- [x] Ngưỡng lọc ghi trong code, kèm số liệu body-oil: còn bao nhiêu ảnh, loại bao nhiêu. Có bằng chứng đã xem bằng mắt các ảnh bị loại.
- [ ] Sau 3 lượt đo lại, **trung vị số vòng giảm ít nhất 30%** so với đường cơ sở (trung vị 32,5 vòng), và chất lượng bộ ảnh vẫn đạt `soat_chu` cùng checklist. Không đạt thì ghi rõ lý do và vòng nào còn thừa, không sửa số.
- [x] `ra/_do-luong.tsv` có đủ các dòng đo.

## Risk Assessment

- **Lọc loại nhầm ảnh đẹp.** Ngưỡng đặt bảo thủ và có `--tat-ca`. Phải xem bằng mắt các ảnh bị loại trước khi chốt.
- **Prompt dài hơn vì ghép brand.** Khoảng 4–5 nghìn token, nằm ở đầu nên được cache. Đổi lại bớt được 3–4 vòng, mỗi vòng đọc lại toàn bộ ngữ cảnh.
- **Đổi cú pháp `bang-nguon` làm hỏng hướng dẫn cũ.** Vẫn nhận cú pháp `<sp> <trang>` như trước, chỉ thêm cách gọi mới.
- **Đo lường lộ dữ liệu nhạy cảm.** Chỉ ghi số và tên model, không ghi prompt hay ghi chú.
