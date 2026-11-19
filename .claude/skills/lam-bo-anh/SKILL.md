---
name: lam-bo-anh
description: Dựng một bộ ảnh review dọc 9:16 (bản nháp) cho một sản phẩm theo giọng văn của brand sản phẩm đó (hiện có Moaw Moaws). Dùng khi người dùng gõ /lam-bo-anh <san-pham> "<ý tưởng>", hoặc nói "làm bộ ảnh", "dựng bộ review", "làm content ảnh cho body oil/love oil/...".
argument-hint: <san-pham> "<ý tưởng hoặc cảm nhận>"
---

# Làm một bộ ảnh review

Đối số: `$ARGUMENTS`. Từ đầu tiên là mã sản phẩm, đúng tên một thư mục trong `nguon/` (không tính `_kho`, `san-pham-mau`). Phần còn lại là ý tưởng hoặc cảm nhận của người dùng. Thiếu mã sản phẩm thì hỏi.

## 1. Nạp brand

Xác định brand theo mục "Xác định brand" trong `docs/them-brand-san-pham-nguon.md`: mã sản phẩm bắt đầu bằng `<brand>-` mà có `docs/brand/<brand>/`; không khớp brand nào thì là `moaw`. Đọc đủ ba file trước khi chọn ảnh hay viết chữ:
- `docs/brand/chung/cach-nghi-content.md`
- `docs/brand/<brand>/thuong-hieu.md`
- `docs/brand/<brand>/giong-van.md`

Brand chưa có thư mục trong `docs/brand/`, hoặc file còn ô **CẦN CHỐT** ảnh hưởng tới bộ đang làm: báo người dùng và hỏi trước khi viết.

Nếu `nguon/<sp>/` không tồn tại hoặc không có ảnh, báo người dùng chạy `tools/drive-kho.sh dong-bo` rồi dừng.

## 2. Chốt góc

Chọn **một** dạng trong `docs/brand/chung/cach-nghi-content.md` dựa trên ý tưởng người dùng. Nói lại góc đã chọn trong một câu. Ý tưởng mơ hồ thì đề xuất 2 góc và để người dùng chọn.

## 3. Xem ảnh nguồn

```bash
tools/bang-nguon.sh <sp> 1
```

Lệnh in đường dẫn bảng và tổng số trang. Đọc ảnh bảng bằng Read, xem hết các trang (đổi số trang). Mở ảnh gốc trong `nguon/<sp>/` khi cần nhìn kỹ. Chọn 3–4 ảnh theo mục "Chọn ảnh".

## 4. Viết `nguon/<sp>/bo-anh.json`

```json
{
  "san_pham": "<sp>",
  "anh": [
    {"mau": "bia", "nguon": "nguon/<sp>/<tên file đúng hoa/thường>", "tieu_de": "<hook>", "phu": "<một dòng>"},
    {"mau": "chi-tiet", "nguon": "nguon/<sp>/<file>", "tieu_de": "<một ý>", "y": ["<dòng 1>", "<dòng 2>"]}
  ]
}
```

Bản review trải nghiệm: không thêm `gia`/`link` và không viết giá hay link trong chữ. Bài bán hàng có giá/link chỉ làm khi người dùng yêu cầu và đã có `nguon/<sp>/brief.json`; lúc đó dựng không có `--trai-nghiem` và chép giá/link nguyên văn brief.

## 5. Dựng và tự soát

```bash
node tools/dung-bo-anh.mjs --trai-nghiem nguon/<sp>/bo-anh.json
```

Đọc `bang_xem` trong JSON trả về bằng Read. Soát theo checklist "Tự soát trước khi trình" trong `docs/brand/chung/cach-nghi-content.md`. Sai thì sửa JSON rồi dựng lại; mỗi lần dựng là một `run_id` mới. Cuối cùng:

```bash
tools/tiktok-anh.sh kiem ra/<sp>/<run_id>/*.jpg
```

## 6. Trình người dùng

Gửi trong chat:
- đường dẫn `bang_xem` và thư mục `ra/<sp>/<run_id>/`;
- lý do chọn từng ảnh, mỗi ảnh một câu, theo thứ tự;
- caption Threads (≤ 500 ký tự) và tiêu đề TikTok (≤ 90 ký tự) theo `giong-van.md` của brand.

Dừng ở đây. Không đăng, không tải ảnh lên đâu. Góp ý chỉ cho bộ này thì sửa và dựng lại. Góp ý áp cho mọi bộ sau thì đề xuất câu cần thêm vào file brand (riêng brand hay `chung/`), chờ người dùng đồng ý mới sửa. Sản phẩm hoặc brand mới: làm theo `docs/them-brand-san-pham-nguon.md`.
