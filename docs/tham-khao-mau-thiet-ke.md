# Tham khảo: repo mẫu thiết kế carousel

Tra ngày 17/11/2026 bằng `gh search repos` (xếp theo số sao) và tìm thêm trên web. Số sao, license và ngày cập nhật lấy từ GitHub API cùng ngày.

Lưu ý chung: phần lớn các repo này dựng chữ trên ảnh do AI vẽ hoặc ảnh kho (Pexels). Mình dùng **ảnh thật cắt từ video sản phẩm**, nên chỉ lấy lớp thiết kế chữ và bố cục, không lấy phần tạo ảnh.

## Nhóm 1: nên thử trước

| Repo | Sao | License | Cập nhật | Dùng được gì |
|---|---|---|---|---|
| [Hainrixz/open-carrusel](https://github.com/Hainrixz/open-carrusel) | 528 | MIT | 25/10/2026 | Chat với Claude để thiết kế slide; mỗi slide là HTML, xuất PNG bằng Puppeteer. Có sẵn khổ 9:16 (1080x1920). Có brand config (màu, font, logo, từ khóa phong cách) mà Claude đọc trước mỗi lần tạo, cho phép lưu carousel thành mẫu, cho tải ảnh lên. Chạy local. **Ứng viên nền tốt nhất.** |
| [alandaitch/instagram-carousel-skill](https://github.com/alandaitch/instagram-carousel-skill) | 18 | MIT | 13/09/2026 | Skill Claude Code chạy trên Open Carrusel, có 6 mẫu HTML (tin tức, mẹo, suy ngẫm). Luồng: đề xuất chữ từng slide, chờ duyệt, rồi xuất PNG và caption. Khổ 4:5, phải đổi sang 9:16. |
| [ludusrusso/mkcr](https://github.com/ludusrusso/mkcr) | 11 | Apache-2.0 | 20/10/2026 | CLI Go viết cho agent: mỗi slide là một mảnh HTML + Tailwind, có xem trước tự tải lại, xuất PNG/PDF bằng Chrome. Có thể thay script Playwright tự viết. Thiên về LinkedIn, cần kiểm có đổi kích thước được không. |
| [houtini-ai/carousels-mcp](https://github.com/houtini-ai/carousels-mcp) | 3 | MIT | 16/03/2026 | MCP server biến nội dung thành PNG cho Instagram và Threads (dựng bằng SVG, xuất bằng Puppeteer). Mẫu gần đúng với hướng MausBot gọi qua MCP. Ít người dùng, nội dung đầu vào là bài viết chứ không phải ảnh sản phẩm. |

## Nhóm 2: lấy ý, không lấy code

| Repo | Sao | License | Ý đáng lấy |
|---|---|---|---|
| [chengyi-ai/cy-carousel-skill](https://github.com/chengyi-ai/cy-carousel-skill) | 442 | Không rõ | Bộ carousel kiểu Xiaohongshu: bìa + 10 trang khổ 1440x1920, kèm tiêu đề, nội dung, bình luận ghim. Có kiểm sự thật, ghi nguồn tư liệu và kiểm tự động. Phong cách biên tập rất chỉn chu, hợp với kiểu review ở Việt Nam. |
| [Simonstorms/slidelot](https://github.com/Simonstorms/slidelot) | 9 | Không có | Luồng riêng cho TikTok: AI viết câu móc, dựng 6 slide, đưa vào hàng chờ để duyệt (vuốt chọn), **đẩy nháp TikTok qua Postiz rồi người thêm nhạc**, đọc số liệu để học bài nào thắng. Khớp với hướng mình đã chọn. |
| [mehul-fanawala/linkedin-carousel-skill](https://github.com/mehul-fanawala/linkedin-carousel-skill) | 11 | Không có | 31 phong cách khác hẳn nhau (navy, bảng số liệu, kiểu thread X, báo giấy…). Trước khi làm cả bộ, cho xem trước 3 phong cách để chọn. Dùng làm danh mục cảm hứng. |
| [Upload-Post/viraloop](https://github.com/Upload-Post/viraloop) | 86 | Không có | Đăng 1 bài mỗi ngày, ghi lại câu móc, giờ đăng và phong cách thắng vào `learnings.json`. Gắn với dịch vụ trả phí upload-post. |
| [Samin12/instagram-thread-carousel](https://github.com/Samin12/instagram-thread-carousel) | 88 | Không có | Biến thread chữ thành slide giả giao diện bài tweet. Hợp kiểu "review dạng tâm sự". |

## Nhóm 3: không hợp

- [clawnify/OpenDesign](https://github.com/clawnify/OpenDesign) (131 sao, MIT): trình sửa thiết kế kiểu Canva (Fabric.js). Chỉ cần nếu muốn sửa tay từng ảnh; quá nặng cho luồng tự động.
- [UitbreidenOS/Slidr](https://github.com/UitbreidenOS/Slidr): hơn 115 theme, nhưng có watermark không xóa được, muốn bỏ phải trả tiền.
- [FranciscoMoretti/carousel-generator](https://github.com/FranciscoMoretti/carousel-generator) (216 sao, MIT): ngừng cập nhật từ 2024, chỉ cho LinkedIn.
- [NaufalRizqullah/tiktok-carousel-generator](https://github.com/NaufalRizqullah/tiktok-carousel-generator) (11 sao, MIT): dựng trên ảnh Pexels, không phải ảnh sản phẩm thật.

## Hướng đề xuất

1. Chạy thử Open Carrusel trên máy, khổ 9:16, với vài ảnh trong `nguon/`, để xem chất lượng chữ tiếng Việt và mức sửa được đến đâu.
2. Dựng 3–4 mẫu của mình (bìa móc, chi tiết, ưu/nhược, kêu gọi) dựa trên 6 mẫu của alandaitch và danh mục phong cách của mehul-fanawala (chỉ lấy ý).
3. Nếu Open Carrusel quá nặng để gọi tự động: giữ mẫu HTML, xuất ảnh bằng mkcr hoặc một script Playwright ngắn.
4. Lấy luồng duyệt, đẩy nháp và học từ số liệu của slidelot khi làm tới phần đăng bài.
