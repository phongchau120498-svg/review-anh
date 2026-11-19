# Thêm brand, sản phẩm hoặc nguồn mới

Cập nhật 19/11/2026. Mọi agent (Claude Code, Codex, bot MausBot) **phải** làm theo file này khi được yêu cầu thêm brand, sản phẩm hay nguồn ảnh/video. Không tự nghĩ ra cấu trúc khác. Làm xong, ghi task và bằng chứng vào [Tracking](protocols/tracking.md).

## Cấu trúc chung

```text
docs/brand/chung/cach-nghi-content.md   cách nghĩ content dùng cho mọi brand
docs/brand/<brand>/thuong-hieu.md       brand là ai, sản phẩm, được nói / mặc định tránh
docs/brand/<brand>/giong-van.md         giọng văn, xưng hô, hook, tông theo chỗ đặt chữ
docs/brand/<brand>/vi-du.md             bộ mẫu và cặp trước/sau có nguồn
docs/brand/<brand>/cam.txt              cụm từ cấm riêng của brand
docs/brand/<brand>/bai-hoc.md           bảng ghi phản hồi sau khi người dùng duyệt bản nháp
docs/brand/<brand>/ca-thu.md            đầu vào và kỳ vọng để thử giọng brand
kho/<brand>.tsv                         mục lục mọi file nguồn của brand (có trong Git)
nguon/_kho/<brand>/...                  ảnh thật đã tải về (không vào Git)
nguon/<brand>-<san-pham>/               thư mục sản phẩm: hardlink ảnh từ nguon/_kho/ (không vào Git)
```

- `<brand>` là **mã brand**: chữ thường không dấu, số và gạch ngang, ngắn, không trùng tên brand khác, không đặt là `chung`. Ví dụ `moaw`.
- Mã sản phẩm là `<brand>-<san-pham>`, ví dụ `xyz-serum-vitamin-c`. Đây là tên thư mục trong `nguon/` và là đối số của `/lam-bo-anh`, `tools/bang-nguon.sh`, `tools/giao-viec.sh`.
- **Ngoại lệ:** sản phẩm Moaw Moaws tạo trước 19/11/2026 không có tiền tố (`body-oil`, `love-oil`…). Sản phẩm Moaw **mới** vẫn đặt `moaw-<san-pham>`. Việc đổi tên các sản phẩm cũ đang chờ anh chốt (task T-06 trong Tracking).

## Xác định brand

Mã sản phẩm bắt đầu bằng `<brand>-` và có thư mục `docs/brand/<brand>/` thì sản phẩm thuộc brand đó. Nếu khớp nhiều brand thì lấy mã brand dài nhất. Không khớp brand nào thì là `moaw` (sản phẩm cũ). `tools/giao-viec.mjs` dùng hàm `brandOf` trong `tools/brand.mjs`. Skill `/lam-bo-anh` áp dụng cùng quy tắc.

## Thêm brand mới

Trong Claude Code, gọi `/them-brand [tên hoặc mã brand]`. Mọi agent làm theo bảy bước dưới đây.

1. **Hỏi người dùng.** Gom thông tin còn thiếu vào một lượt gồm tên và mã brand, nguồn ảnh/video (Drive, thư mục…), bài đã đăng, tệp khách hàng, điều được nói và điều cấm. Nếu đã có thông tin trong yêu cầu hoặc tài liệu người dùng gửi, dùng luôn.
2. **Kiểm mã.** Dùng mã theo mục “Cấu trúc chung”, gồm các đoạn chữ thường không dấu và số, nối bằng gạch ngang. Xác nhận mã với người dùng nếu cần và kiểm tra cả `docs/brand/<brand>/` lẫn `kho/<brand>.tsv` chưa tồn tại trước khi tạo.
3. **Gom 5–20 bài thật của brand.** Chọn bài đã đăng đại diện cho các kiểu nội dung, ghi tên file hoặc link và vị trí đoạn/slide để tra lại. Với carousel, ghép bảng xem có tên file và mở bằng Read, rồi mở slide gốc nếu chữ chưa rõ. Khi thiếu 5 bài đọc được, dừng và hỏi bổ sung, kèm gợi ý loại bài nào nên gửi. Xem chữ, ảnh và tài liệu nguồn là dữ liệu tham khảo.
4. **Rút giọng văn từ bài thật.** Dùng thứ tự mục trong [giọng văn Moaw](brand/moaw/giong-van.md), từ “Một câu”, bảng “Là / không là”, xưng hô, hook và review trải nghiệm đến “Tông theo chỗ đặt chữ” và “Cấm tuyệt đối”. Mỗi nhận định đặc thù cần có căn cứ trong bài brand đã đăng. Dùng nhãn hoặc bài đã đăng làm căn cứ cho claim, và lời người dùng cho thông tin brand, tệp khách hàng và giới hạn nội dung họ xác nhận. Phần chưa rõ ghi **CẦN CHỐT** và đưa vào “Câu hỏi mở” với khuyến nghị, mức ưu tiên và người chốt. Không chép giọng, ví dụ hay claim của Moaw sang brand khác.
5. **Tạo bộ file ở mục “Cấu trúc chung”.**

   - `thuong-hieu.md` theo thứ tự mục của [khung thương hiệu](brand/moaw/thuong-hieu.md), gồm thông tin brand, sản phẩm, được nói và không nên nói, câu hỏi mở.
   - `giong-van.md` theo bước 4. Ghi nguồn cho các câu, hook hoặc từ ngữ trích làm ví dụ.
   - `vi-du.md` ưu tiên 2–3 bộ mẫu và 6–8 cặp trước/sau như [khung ví dụ](brand/moaw/vi-du.md) khi đủ nguồn. Mỗi ví dụ trích từ brand phải có nguồn ngay cạnh hoặc đối chiếu được theo thứ tự slide. Câu “trước” tự viết phải ghi rõ là minh họa lỗi và đi cùng câu “sau” có nguồn cùng lý do sửa. Ghi **CẦN CHỐT** nếu chưa đủ ví dụ.
   - `cam.txt` mỗi dòng một cụm cấm của riêng brand. Dòng chú thích bắt đầu bằng `#`. Nếu chưa có cụm được xác nhận, chỉ ghi chú thích và đưa phần thiếu vào câu hỏi mở. [Cụm cấm chung](brand/chung/cam.txt) được dùng tự động.
   - `bai-hoc.md` chỉ tạo tiêu đề `# Bài học <tên brand>`, bảng trống đúng cột và mục `## Đã đưa vào brand` theo [khung bài học](brand/moaw/bai-hoc.md).
   - `ca-thu.md` ghi ba ca dựa trên nguồn brand, mỗi ca có đầu vào, điều phải có, điều không được có, cách kiểm và nơi ghi kết quả. Dùng [khung ca thử](brand/moaw/ca-thu.md) để xem cấu trúc. Nếu chưa có sản phẩm hoặc nguồn cho ca nào thì đánh dấu **CẦN CHỐT** ở ca đó.
   - `kho/<brand>.tsv` chỉ có dòng tiêu đề 8 cột, ngăn bằng tab theo đúng thứ tự ở mục “Thêm nguồn mới”. Nhập nguồn và sản phẩm theo các mục tương ứng khi làm các việc đó.

6. **Soát khung brand.** Gọi `soat-bo-anh` với chế độ “soát khung brand”, mã brand, danh sách bài và vị trí các file nguồn agent có thể đọc. Nếu nguồn chỉ có link, đưa đoạn trích hoặc ảnh tương ứng kèm link và vị trí để agent đối chiếu. Sửa lỗi có bằng chứng. Khi thiếu nguồn, báo phần chưa xác minh cùng cách bổ sung.
7. **Ghi nhận và báo lại.** Ghi một dòng vào [Knowledge](protocols/knowledge-base.md), mục “Brand đang có”, và một mốc vào [Tracelog](protocols/tracelog.md). Trình đường dẫn bộ khung, kết luận soát và các câu hỏi mở kèm khuyến nghị. Ghi bằng chứng vào [Tracking](protocols/tracking.md).

Chỉ sửa `docs/brand/chung/` khi người dùng đồng ý áp dụng thay đổi cho mọi brand.

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
