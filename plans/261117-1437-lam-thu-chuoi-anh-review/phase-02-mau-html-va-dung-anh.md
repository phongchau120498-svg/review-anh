---
phase: 2
title: "Mẫu HTML và dựng ảnh"
status: pending
priority: P1
dependencies: []
---

# Phase 2: Mẫu HTML và dựng ảnh

## Overview

Thay lệnh `chu` (ImageMagick) bằng mẫu HTML/CSS, chụp ra ảnh bằng Playwright. Kết quả là một lệnh nhận ảnh nguồn và chữ, trả về bộ ảnh 1080x1920 đạt chuẩn đăng.

## Requirements

- 3 mẫu ban đầu:
  - **bìa**: ảnh nền kèm câu móc lớn;
  - **chi tiết**: ảnh kèm 1 tiêu đề và 2–3 ý;
  - **kêu gọi**: ảnh kèm lời kêu gọi và giá.
- Chữ tiếng Việt đủ dấu. Dùng font miễn phí (Be Vietnam Pro hoặc Noto Sans), tải về đặt trong repo; không dùng SVN-Gilroy.
- Chừa vùng an toàn của TikTok, như script hiện có: 220px trên, 520px dưới, 170px bên phải.
- Chữ dài phải tự xuống dòng và co cỡ, không được tràn hay bị cắt.
- Đầu vào là một file JSON cho mỗi bộ ảnh, để sau này bot sinh ra được:

```json
{ "san_pham": "...", "anh": [
  { "mau": "bia", "nguon": "nguon/IMG_2240.jpg", "tieu_de": "...", "phu": "..." },
  { "mau": "chi-tiet", "nguon": "...", "tieu_de": "...", "y": ["...", "..."] },
  { "mau": "keu-goi", "nguon": "...", "tieu_de": "...", "gia": "..." } ],
  "caption": "..." }
```

## Architecture

- Đọc JSON, ráp mẫu HTML với ảnh nguồn, Playwright chụp màn hình 1080x1920, rồi ImageMagick chuyển sRGB, xóa metadata và chạy `kiem`.
- Viết bằng Node, vì Playwright chạy tốt trên Node và máy đã có Chrome cùng bộ trình duyệt Playwright tải sẵn.

## Related Code Files

- Create: `package.json` (chỉ cần `playwright`), `mau/bia.html`, `mau/chi-tiet.html`, `mau/keu-goi.html`, `mau/chung.css`, `fonts/`, `tools/dung-bo-anh.mjs`.
- Modify: `tools/tiktok-anh.sh`: bỏ `chu`, giữ `khung`, `bang`, `luoi`, `kiem`; cập nhật `README.md`.

## Implementation Steps

1. Chọn và tải font, kiểm giấy phép (OFL).
2. Viết 3 mẫu, tham khảo bố cục của Open Carrusel và alandaitch (chỉ lấy ý, xem `docs/tham-khao-mau-thiet-ke.md`).
3. Viết `dung-bo-anh.mjs`: đọc JSON, xuất `ra/<sản phẩm>/<n>.jpg`, gọi `kiem` cho từng ảnh, rồi ghép bảng `luoi`.
4. Thử với 3 ảnh trong `nguon/`. Gồm một chữ cực dài và chữ có đủ các dấu (ỗ, ự, ẫ…).
5. Gửi bảng lưới kết quả cho anh xem phong cách.

## Success Criteria

- [ ] Một lệnh từ JSON ra 3 ảnh, tất cả qua `kiem` (1080x1920, sRGB, không metadata, dưới 20 MB).
- [ ] Chữ dài 120 ký tự không tràn, không bị cắt; dấu tiếng Việt hiển thị đúng.
- [ ] Anh duyệt phong cách, hoặc góp ý để sửa một vòng.

## Risk Assessment

- **Font không có đủ dấu:** chọn font đã kiểm dấu ở bước 4.
- **Ảnh HEIC:** Chrome không mở được. Chuyển sang JPEG bằng ImageMagick trước khi đưa vào mẫu.
