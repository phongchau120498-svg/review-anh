---
phase: 2
title: "Kiểm máy chữ và caption"
status: completed
priority: P1
dependencies: [1]
---

# Phase 2: Kiểm máy chữ và caption

## Overview

Luật nào kiểm được bằng máy thì viết thành code, không chỉ để trong văn bản cho agent tự nhớ (agentbook: luật mơ hồ đổi thành điều kiện đúng/sai; người kiểm bằng code đáng tin hơn lời agent tự báo). Phase này thêm hai module:
- `tools/brand.mjs`: biết sản phẩm thuộc brand nào;
- `tools/soat-chu.mjs`: soát chữ trên ảnh và caption theo cụm cấm, giá/link và độ dài.

Phase này cũng nối `soat-chu` vào `giao-viec`.

## Requirements

- **Lỗi** (chặn): chữ chứa cụm cấm của `docs/brand/chung/cam.txt` hoặc `docs/brand/<brand>/cam.txt`; bản trải nghiệm có giá hoặc link.
- **Cảnh báo** (không chặn): chữ vượt ngưỡng độ dài trong mục "Tông theo chỗ đặt chữ" của phase 1.
- Không thêm phụ thuộc npm. Dùng chung `validateCopy` sẵn có trong `tools/dung-bo-anh.mjs` cho phần giá/link, không viết lại.
- Kết quả là JSON, để agent và test cùng đọc được.

## Architecture

```text
tools/brand.mjs     brandOf(product, root) · brandDir(product, root) · camList(product, root)
tools/soat-chu.mjs  soatChu({ data, caption?, product, traiNghiem }) → { dat, loi: [...], canh_bao: [...] }
                    CLI: node tools/soat-chu.mjs [--ban-hang] nguon/<sp>/bo-anh.json
tools/giao-viec.mjs import brandOf từ brand.mjs (bỏ bản sao trong file);
                    gọi soatChu cho bo-anh + caption trước khi trả ok:true;
                    thêm "node tools/soat-chu.mjs nguon/<sp>/bo-anh.json" vào danh sách lệnh được phép
```

**Quy tắc so khớp cụm cấm:**
- chuẩn hóa cả cụm và chữ về NFC, chữ thường;
- khi so, bỏ dấu chấm, gạch dưới và dấu sao chèn giữa hai chữ cái, để `viê.m` vẫn khớp `viêm`;
- so theo chuỗi con nhưng có ranh giới chữ: ký tự trước và sau cụm không được là chữ hay số (`\p{L}\p{N}`).

**Mỗi lỗi ghi:** `{ loai: "cum-cam" | "gia-link", cho: "anh[0].tieu_de" | "caption.threads" ..., trich: "<đoạn vi phạm>", cum?: "<cụm>" }`.

**Mỗi cảnh báo ghi:** `{ loai: "do-dai", cho, gioi_han, thuc_te }`. Đếm từ bằng cách tách theo khoảng trắng. Caption Threads tính ký tự theo code point; tiêu đề TikTok tính theo đơn vị UTF-16, cùng cách README đang mô tả cho Postiz.

## Related Code Files

- Create: `tools/brand.mjs`, `tools/soat-chu.mjs`, `tools/soat-chu.test.mjs`
- Modify: `tools/giao-viec.mjs` (import `brandOf`, gọi `soatChu`, danh sách lệnh, prompt bước 3 thêm lệnh soát), `tools/giao-viec.test.mjs` (lệnh soát được phép, caption có cụm cấm → `ok:false`)

## Implementation Steps

1. Chuyển `brandOf` và `brandDocs` từ `tools/giao-viec.mjs` sang `tools/brand.mjs`, nhận thêm tham số `root`. Bổ sung `camList`, đọc hai file `cam.txt`; file không tồn tại thì coi là danh sách rỗng.
2. Viết `tools/soat-chu.mjs`, gồm hàm `soatChu` và CLI.
   - Mặc định là chế độ trải nghiệm: gọi `validateCopy(data)` không kèm brief; bắt lỗi thì ghi `gia-link`.
   - Với `--ban-hang`: đọc brief bằng `readBrief`, rồi `validateCopy(data, brief)`.
   - Mã thoát: `0` khi không có lỗi (dù có cảnh báo), `1` khi có lỗi, `2` khi đối số sai.
3. Viết test `tools/soat-chu.test.mjs` theo cách các test khác trong `tools/` đang làm (`node:test`, thư mục tạm), gồm các ca:
   - cụm cấm thường, cụm viết chèn dấu chấm (`viê.m`), cụm có chữ hoa và dấu;
   - câu hợp lệ **không** bị bắt nhầm: "thông thoáng lcl", "không chịu nổi mùi này", "trắng sáng";
   - giá hoặc link trong chế độ trải nghiệm;
   - ngưỡng độ dài: đúng bằng ngưỡng không cảnh báo, vượt một từ thì cảnh báo;
   - `brandOf` cho sản phẩm không có tiền tố, có tiền tố đúng, và tiền tố trùng một phần tên brand khác.
4. Nối vào `giao-viec.mjs`:
   - trước khi trả `ok:true`, gọi `soatChu` với `data` của lượt dựng và caption;
   - có lỗi thì trả `{ ok:false, loi:"Chữ vi phạm: <tóm tắt 1–3 lỗi>" }`;
   - thêm lệnh soát vào danh sách lệnh được phép và vào bước 3 của prompt.
5. Chạy test hẹp:
   ```bash
   node --test tools/soat-chu.test.mjs tools/giao-viec.test.mjs tools/dung-bo-anh.test.mjs
   ```

## Success Criteria

- [x] Test hẹp đạt. Có test cho cả trường hợp bắt đúng và trường hợp không bắt nhầm.
- [x] `node tools/soat-chu.mjs nguon/body-oil/bo-anh.json` chạy trên một bộ thật, in JSON và mã thoát đúng.
- [x] `giao-viec` không còn bản sao của `brandOf`. Caption có cụm cấm làm lượt dựng trả `ok:false`.

## Risk Assessment

- **Bắt nhầm làm hỏng lượt dựng thật.** Chỉ cụm cấm và giá/link là chặn; độ dài chỉ cảnh báo. Có test chống bắt nhầm.
- **Đổi `giao-viec` ảnh hưởng tới luồng Thu Trinh.** Chạy lại toàn bộ `tools/giao-viec.test.mjs`. Phase 6 chạy `npm test` đầy đủ.
