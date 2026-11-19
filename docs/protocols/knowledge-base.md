# Knowledge Base

Cập nhật 19/11/2026. Kiến thức đã xác nhận. Chi tiết nằm ở tài liệu được dẫn.

## Brand đang có

| Mã brand | Brand | Bộ brand | Mục lục | Ghi chú |
|---|---|---|---|---|
| `moaw` | Moaw Moaws | [docs/brand/moaw/](../brand/moaw/thuong-hieu.md) | `kho/moaw.tsv` | Sản phẩm cũ không có tiền tố (`body-oil`…), xem T-06 |

Thêm brand: [hướng dẫn](../them-brand-san-pham-nguon.md).

## Thuật ngữ

| Từ | Nghĩa |
|---|---|
| Bộ ảnh | 3–4 ảnh 1080×1920 có chữ, gồm 1 ảnh bìa (`mau: "bia"`) và các ảnh chi tiết (`mau: "chi-tiet"`) |
| `bo-anh.json` | Bản viết của agent: ảnh nguồn và chữ từng slide, nằm ở `nguon/<sp>/` |
| `run_id`, `ra/<sp>/<run_id>/` | Một lần dựng: JPEG, `manifest.json`, `_xem/bang-ket-qua.jpg`. Không ghi đè lần dựng cũ |
| Brief | `nguon/<sp>/brief.json`: tên, 3 điểm nổi bật, giá, link, domain. Bắt buộc với bài bán hàng; `brief.nhap.json` là bản chờ điền |
| Review trải nghiệm | Chế độ `--trai-nghiem`: không cần brief, cấm giá và link |
| Bảng nguồn | `ra/_bang-nguon/<sp>/trang-N.jpg`, 40 ảnh/trang có tên file |
| Mục lục kho | `kho/<brand>.tsv`, mỗi file nguồn một dòng. Cột xem [hướng dẫn thêm nguồn](../them-brand-san-pham-nguon.md) |
| `shared_computer` | Tool của server MausBot để bot dùng thư mục và terminal của máy được cho mượn |
| Giao việc | `tools/giao-viec.sh`: bot gọi để Claude Code headless trên PC dựng bản nháp, trả một JSON |
| ttbc, lcl, sckd/stkd | Viết tắt trong giọng văn Moaw: tẩy tế bào chết, lỗ chân lông, sữa chua/sữa tươi không đường |

## Nghiệp vụ

- TikTok bài ảnh: link ảnh phải thuộc domain đã xác minh. App chưa duyệt chỉ đăng riêng tư (SELF_ONLY). Threads: carousel 2–20 ảnh. Chi tiết ở [hướng làm](../huong-lam.md).
- Ảnh gốc iPhone hay có đuôi lệch định dạng thật (`.PNG` nhưng là JPEG). Renderer chọn bộ giải mã theo đuôi, nên phải sửa đuôi trước khi dùng.
- Chữ đặt giữa ảnh: chọn ảnh có sản phẩm lệch khỏi giữa khung.

## Tài liệu chi tiết

[Hướng làm](../huong-lam.md) · [Kho nguồn](../kho-nguon.md) · [Hướng dẫn bot (MCP)](../huong-dan-bot.md) · [Thu Trinh trên máy Linux](../huong-dan-thu-trinh-may-linux.md) · [Postiz local](../postiz-local.md)

## Chưa xác nhận

Các ô **CẦN CHỐT** trong `docs/brand/moaw/thuong-hieu.md`: tệp khách hàng, tên các sản phẩm túi và chai nhỏ, mức "trắng" được nói (T-02).
