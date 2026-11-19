# Thêm brand, sản phẩm hoặc nguồn mới

Cập nhật 19/11/2026. Mọi agent (Claude Code, Codex, bot MausBot) **phải** làm theo file này khi được yêu cầu thêm brand, sản phẩm hay nguồn ảnh/video. Không tự nghĩ ra cấu trúc khác. Làm xong, ghi task và bằng chứng vào [Tracking](protocols/tracking.md).

## Cấu trúc chung

```text
docs/brand/chung/cach-nghi-content.md   cách nghĩ content dùng cho mọi brand
docs/brand/<brand>/thuong-hieu.md       brand là ai, sản phẩm, được nói / mặc định tránh
docs/brand/<brand>/giong-van.md         xưng hô, câu chữ, hook, caption, ví dụ thật của brand
kho/<brand>.tsv                         mục lục mọi file nguồn của brand (có trong Git)
nguon/_kho/<brand>/...                  ảnh thật đã tải về (không vào Git)
nguon/<brand>-<san-pham>/               thư mục sản phẩm: hardlink ảnh từ nguon/_kho/ (không vào Git)
```

- `<brand>` là **mã brand**: chữ thường không dấu, số và gạch ngang, ngắn, không trùng tên brand khác, không đặt là `chung`. Ví dụ `moaw`.
- Mã sản phẩm là `<brand>-<san-pham>`, ví dụ `xyz-serum-vitamin-c`. Đây là tên thư mục trong `nguon/` và là đối số của `/lam-bo-anh`, `tools/bang-nguon.sh`, `tools/giao-viec.sh`.
- **Ngoại lệ:** sản phẩm Moaw Moaws tạo trước 19/11/2026 không có tiền tố (`body-oil`, `love-oil`…). Sản phẩm Moaw **mới** vẫn đặt `moaw-<san-pham>`. Việc đổi tên các sản phẩm cũ đang chờ anh chốt (task T-06 trong Tracking).

## Xác định brand

Mã sản phẩm bắt đầu bằng `<brand>-` và có thư mục `docs/brand/<brand>/` thì sản phẩm thuộc brand đó. Nếu khớp nhiều brand thì lấy mã brand dài nhất. Không khớp brand nào thì là `moaw` (sản phẩm cũ). `tools/giao-viec.mjs` (hàm `brandOf`) và skill `/lam-bo-anh` dùng cùng quy tắc này.

## Thêm brand mới

1. **Hỏi người dùng** trước khi tạo, gom thành một lượt hỏi:
   - tên brand và mã brand;
   - nguồn ảnh/video (link Drive, thư mục…);
   - bài đã đăng để tham khảo giọng văn;
   - tệp khách hàng;
   - điều được nói và điều cấm.
2. Tạo `docs/brand/<brand>/thuong-hieu.md` và `giong-van.md`, **theo đúng mục và thứ tự** của bản Moaw (`docs/brand/moaw/`). Nội dung chỉ lấy từ:
   - nhãn sản phẩm;
   - bài brand đã đăng;
   - lời người dùng.

   Thiếu thì ghi **CẦN CHỐT**. Không chép giọng văn hay claim của Moaw sang brand khác.
3. Không sửa `docs/brand/chung/` trừ khi người dùng đồng ý đó là quy tắc cho mọi brand.
4. Thêm nguồn theo mục "Thêm nguồn mới", rồi thêm từng sản phẩm theo mục "Thêm sản phẩm".
5. Ghi một dòng vào [Knowledge](protocols/knowledge-base.md), mục "Brand đang có", và một mốc vào [Tracelog](protocols/tracelog.md).

## Thêm sản phẩm

1. Chọn mã `<brand>-<san-pham>`. Kiểm tra `nguon/` chưa có tên này.
2. Thêm một dòng vào bảng "Sản phẩm" trong `docs/brand/<brand>/thuong-hieu.md`:
   - tên trên nhãn;
   - tên gọi trong bài;
   - sản phẩm hợp với ai;
   - điểm brand đã nói, kèm nguồn.

   Phần chưa có nguồn thì ghi **CẦN CHỐT**.
3. Trong `kho/<brand>.tsv`, ghi mã sản phẩm vào cột `san_pham` của các ảnh thuộc sản phẩm này, rồi chạy `tools/drive-kho.sh dong-bo` để tạo thư mục và hardlink.
4. Kiểm tra bằng `tools/bang-nguon.sh <brand>-<san-pham> 1`: lệnh in đủ số ảnh, bảng không lẫn sản phẩm khác.
5. Chỉ tạo `nguon/<sp>/brief.json` (giá, link, domain, 3 điểm nổi bật) khi người dùng **xác nhận** giá và link. Bản review trải nghiệm không cần brief.

## Thêm nguồn mới

1. Ảnh và video thật **không vào Git**. Chỉ mục lục `kho/<brand>.tsv` vào Git.
2. Mục lục có 8 cột, ngăn bằng tab, dòng đầu là tiêu đề:

   | Cột | Ý nghĩa |
   |---|---|
   | `nhom_drive` | Nhóm nguồn gốc, ví dụ tên thư mục Drive, `KOC <tên>`, `chụp tại studio` |
   | `san_pham` | Một hoặc nhiều mã thư mục trong `nguon/`, nối bằng `+`. Tên đuôi `-chung` (ảnh không có sản phẩm) vào `nguon/_kho/`. Tên bắt đầu `_` chỉ tải, không tạo thư mục (`_trung-lap`, `_da-chen-chu`, `_chua-phan-loai`…) |
   | `loai` | `anh`, `anh-cuon` (bài đã đăng, chỉ tham khảo), `video-edit`, `video-tho` |
   | `tai_ve` | Đường dẫn trong `nguon/_kho/`, dạng `<thu-muc>/<ten-file>`. Bỏ trống nếu chưa tải |
   | `drive_id` | ID file Drive |
   | `ngay` | Ngày tạo file nguồn, `YYYY-MM-DD` |
   | `ten_goc` | Tên file gốc |
   | `dung_lam` | Ghi chú ngắn: nguồn ảnh, chỉ tham khảo, đã chèn chữ… |

3. Nguồn **Google Drive** để chế độ ai có link cũng xem: lấy danh sách file (ví dụ bằng connector Drive), ghi mục lục, rồi chạy `tools/drive-kho.sh dong-bo`. Video không tải nguyên file: lấy khung bằng `tools/drive-kho.sh khung`.
4. Nguồn **khác Drive** (thư mục máy, ổ cứng, link mạng xã hội): chép file vào `nguon/_kho/<brand>/<nhom>/` và để trống `drive_id`. `dong-bo` hiện chỉ tải được từ Drive. Viết thêm loại nguồn khác vào `tools/drive-kho.sh` khi thật sự có nguồn đó, và chỉ làm khi người dùng giao.
5. Phân loại ảnh theo sản phẩm bằng bảng xem (ghép ảnh thu nhỏ, xem bằng mắt). Ảnh đã chèn chữ, ảnh chụp màn hình, ảnh lộ thông tin riêng thì không đưa vào thư mục sản phẩm.
6. Đuôi file phải đúng định dạng thật (`file -b --mime-type`): renderer chọn bộ giải mã theo đuôi, sai đuôi sẽ lỗi.

## Không làm

- Không đặt mã brand hay mã sản phẩm có dấu, khoảng trắng hoặc chữ hoa.
- Không bịa giá, link, claim hay trải nghiệm cho brand mới.
- Không sửa code `tools/`, `mcp/` chỉ để thêm brand. Cấu trúc trên không cần đổi code. Nếu thấy cần đổi code, báo người dùng và ghi task.
- Không đưa ảnh, video hay file tải về vào Git.
