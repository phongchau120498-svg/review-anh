# Kho nguồn Moaw Moaws

Cập nhật: 18/11/2026. Ảnh, video và mục lục nằm trong `nguon/` (Git ignore). File này chỉ ghi cách tổ chức.

## Kho Drive gốc

Folder `[G] VIDEO` anh gửi xếp theo **kiểu cảnh quay**, không theo sản phẩm:

| Folder Drive | Nội dung | Số file | Đã lấy về |
|---|---|---|---|
| `[G] ẢNH SP & BODY` | Ảnh sản phẩm và ảnh body | ~460 ảnh, 0,75 GB | Tải hết; bỏ 48 bản trùng byte |
| `SHOW/CHẠM DA` | Video mẫu chạm da, test sản phẩm | 81 video, 4,8 GB | Chưa tải, có trong mục lục |
| `ACTION SP` | Video chạm sản phẩm, show chính diện | ~715 video, 51,5 GB | Chưa tải, có trong mục lục |
| `SOURCE EDIT/[E] EDIT` | Video TikTok thành phẩm, đã có chữ và banner shop | 99 video | 2 khung mỗi video, đã gán sản phẩm |
| `SOURCE EDIT/[E] ẢNH CUỘN` | Slide carousel đã đăng | 66 ảnh | Tải hết, dùng làm mẫu |

## Thư mục trong `nguon/`

Mỗi sản phẩm một thư mục phẳng (tool chỉ đọc ảnh nằm ngay trong thư mục). Ảnh là hardlink từ `_kho/`, không tốn thêm dung lượng.

| Thư mục | Sản phẩm | Ảnh |
|---|---|---|
| `body-oil` | Body Oil, chai vàng | 92 |
| `love-oil` | Love Oil, chai hồng | 58 |
| `sunkissed` | Bộ chai nhỏ, nước hoa Sunkissed (chờ anh xác nhận tên) | 11 |
| `muoi-hong` | Hũ hồng, scrub muối hồng Radiant White Booster | 6 |
| `bot-thao-moc` | Hũ to, ủ/đắp bột thảo mộc | 18 |
| `scrub-radiant-white` | Túi Radiant White Exfoliating Body Scrub | 7 |
| `scrub-nach` | Túi B-Salt Tone Up Pit Scrub | 6 |
| `combo` | Ảnh có từ 2 sản phẩm trở lên | 100 |

`_kho/` không hiện thành sản phẩm trong `list_nguon`:

- `anh-sp-body/`: toàn bộ ảnh gốc đã tải. `_trung/`: bản trùng byte.
- `body-chung/`: 93 ảnh body không thấy sản phẩm. Muốn dùng cho một sản phẩm thì hardlink ảnh đã chọn vào thư mục sản phẩm đó.
- `anh-cuon/`: slide đã đăng. Chỉ tham khảo bố cục và giọng văn, không dùng làm ảnh nguồn.
- `khung-edit/<drive_id>-a.jpg`, `-b.jpg`: khung từ video EDIT, có chữ in sẵn. Chỉ tham khảo hook và kịch bản.
- Mục lục nằm ở `kho/moaw.tsv` (có trong Git, để máy mới tải lại bằng `tools/drive-kho.sh dong-bo`): mỗi file Drive một dòng: `nhom_drive`, `san_pham`, `loai`, `tai_ve` (đường dẫn trong `_kho/`, trống nếu chưa tải), `drive_id`, `ngay`, `ten_goc`, `dung_lam`.

Phân loại làm bằng mắt trên ảnh thu nhỏ, có thể sai vài ảnh. Bot vẫn phải xem bảng ảnh trước khi chọn.

## Brief

Mỗi thư mục có `brief.nhap.json`, đã điền tên. Giá, link, domain và 3 điểm nổi bật để `CẦN ANH ĐIỀN`. Tool chỉ đọc `brief.json`; thiếu file này thì `list_nguon` và `view_bang_anh_nguon` báo lỗi, bot phải dừng hỏi anh. Điền xong thì đổi tên thành `brief.json`.

## Không có trong thư mục sản phẩm

- Ảnh đã chèn chữ (18), ảnh không gian không có sản phẩm (10), ảnh chụp màn hình đơn hàng (1): chỉ có trong `_kho/anh-sp-body/` và mục lục.
- Tuýp tím (Sữa gạo hạnh nhân) và tuýp xanh (Gel tắm AHA-BHA): chỉ 3 ảnh, chưa đủ một bộ.
- Video thô `ACTION SP` và `SHOW/CHẠM DA`: chưa phân loại theo sản phẩm.

## Lấy thêm từ Drive

Tra `drive_id` trong `kho/moaw.tsv`, rồi:

```bash
tools/drive-kho.sh khung nguon/_kho/khung-tho <drive_id>
tools/drive-kho.sh tai nguon/<san-pham> <drive_id> <ten-file>
```

`khung` đọc từng đoạn video qua HTTP Range, mất khoảng 3 giây mỗi khung, không tải nguyên file. Lệnh chỉ chạy được khi file Drive để chế độ ai có link cũng xem được. Khung dùng làm nguồn thì đặt vào thư mục sản phẩm. Video iPhone HDR có thể nhạt màu; kiểm trước khi dựng.
