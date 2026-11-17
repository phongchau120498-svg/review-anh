# Hướng làm

Cập nhật: 17/11/2026.

## Đầu vào và đầu ra

- **Vào:** kho ảnh/video sản phẩm quay sẵn. Mỗi sản phẩm một thư mục, kèm brief ngắn: tên, 3 điểm nổi bật, giá, link.
- **Ra:** bộ 3–4 ảnh 1080x1920 có chữ, kèm caption, **tự động** đăng lên TikTok (bài dạng ảnh) và Threads (bài nhiều ảnh).

## Quyết định đã chốt

| Việc | Chốt | Lý do |
|---|---|---|
| Bộ não | **Không dựng não riêng.** MausBot là não: bot chạy engine Claude, Codex hoặc Antigravity bằng tài khoản đã đăng nhập. | MausBot đã có sẵn các engine này. Đăng nhập, hạn mức, luật viết và trí nhớ nằm chung một chỗ. |
| Repo này | **Chỉ làm tay chân:** dựng, kiểm và tải ảnh qua MCP cho MausBot gọi. | Ít code, dễ kiểm, đổi model mà không phải sửa repo. |
| Đăng bài | **Tự động hoàn toàn qua Postiz**, không đăng tay. | Postiz có API công khai, có MCP server, hỗ trợ TikTok và Threads. |
| Nơi chạy Postiz | **Bước đầu chạy local bằng Docker**, khi ổn thì chuyển lên Dokploy. | Thử nghiệm không tốn tiền thuê server. Đăng đều hằng ngày thì cần server luôn bật và có HTTPS. |
| Thiết kế chữ | Mẫu HTML/CSS cố định, chụp ra ảnh bằng Playwright. Tham khảo mẫu trong [repo mẫu thiết kế](tham-khao-mau-thiet-ke.md). | Tự động hoàn toàn, MausBot gọi được. ImageMagick vẽ chữ dài dễ tràn. |

## Chuỗi xử lý

| Bước | Ai làm | Công cụ | Kết quả |
|---|---|---|---|
| 1. Kho nguồn | Anh | Thư mục `nguon/<sản phẩm>/` | Video, ảnh, brief |
| 2. Lọc khung | Tay chân | FFmpeg; video HDR của iPhone đổi sang SDR trước | 15–20 khung ứng viên, đã bỏ khung mờ |
| 3. Chọn ảnh | Bot MausBot | Xem bảng khung (ảnh); nếu engine mở được video thì xem cả video | 3–4 khung kèm lý do: nét, thấy rõ sản phẩm, mỗi khung một góc |
| 4. Viết chữ, dựng ảnh | Bot viết chữ, tay chân dựng | Mẫu HTML + Playwright | Bộ ảnh 1080x1920 kèm caption |
| 5. Kiểm chuẩn | Tay chân kiểm máy, bot soát chữ | ImageMagick: 1080x1920, sRGB, không metadata, dưới 20 MB | Đạt, hoặc quay lại bước 4 |
| 6. Đăng | Bot gọi Postiz | Postiz qua API/MCP | Bài TikTok và Threads theo lịch |

Bước 3 dùng ảnh làm mặc định vì engine nào cũng xem được ảnh. Muốn bot xem cả video thì phải kiểm engine Antigravity trong MausBot có mở được file video không. Nếu không được, thêm một công cụ "xem video" gọi `agy` (công cụ này vẫn do bot gọi).

## Ràng buộc khi đăng

- **TikTok:**
  - API bài ảnh chỉ kéo ảnh về từ link (PULL_FROM_URL), và link phải thuộc domain đã xác minh với TikTok.
  - App chưa được TikTok duyệt thì có 3 giới hạn: bài chỉ để riêng tư (SELF_ONLY), **chính tài khoản đăng phải để riêng tư**, và tối đa 5 người đăng trong 24 giờ. Vì vậy bản thử dùng một tài khoản TikTok thử để riêng tư, và nộp hồ sơ duyệt app song song.
  - Thiết lập trong Postiz phải là `content_posting_method: "DIRECT_POST"` và `autoAddMusic: "yes"`. Nếu chọn `UPLOAD`, Postiz bỏ qua các thiết lập này mà vẫn báo đăng thành công.
- **Cổng duyệt trong MausBot:** bot có Postiz phải chạy ở mức duyệt **Ask**. Thiết lập "Gửi thay anh" chỉ áp cho các ứng dụng kết nối (Composio), không chặn được MCP Postiz. Ở mức Full access, mọi lệnh được duyệt tự động (`server/auto-approve.ts`). Postiz nối qua thẻ có sẵn **Apps → Social → Postiz**.
- **Threads:** carousel 2–20 ảnh, giới hạn 250 bài/24 giờ, ảnh phải có link công khai.
- **Chạy local vẫn cần:**
  - một kho ảnh công khai (Postiz hỗ trợ Cloudflare R2);
  - HTTPS cho bước kết nối tài khoản (Cloudflare Tunnel);
  - máy phải bật đúng giờ đăng.
- **Phương án dự phòng:** Postiz Cloud. App TikTok của họ đã được duyệt nên đăng công khai được ngay, nhưng phải trả phí tháng.
- **Không tự động hóa đăng TikTok qua trình duyệt:** dễ bị phát hiện là bot, có thể mất kênh.

## Mở rộng sau

- **OneHand:** các module KocBooking (video review của KOC thành bộ ảnh), Offering (brief sản phẩm), PagePosts/Meta (Facebook Page), Zalo (gửi khách, qua cổng kiểm duyệt). Agent Hub của OneHand cũng là một hub CLI; chỉ chọn một trong hai làm não, không dựng cái thứ ba.
- **Các ý mượn được từ Agent Edit:** xem [tham khảo Agent Edit](tham-khao-agent-edit.md).

## Trạng thái

- Script `tools/tiktok-anh.sh` đã thử trích khung, chèn chữ tiếng Việt, ghép bảng. Ảnh thử cũ nằm trong `ra/thu` và `ra/thu-body-oil`.
- Có mẫu HTML dọc 9:16 và MCP dựng, kiểm và tải ảnh. Đã kiểm luồng với MausBot cô lập và Postiz giả. Mẫu đã sửa theo góp ý của anh và sẽ dùng cho lượt thử với brief thật.
- Có cấu hình Postiz local, chờ tài khoản thử và domain để bắt đầu thiết lập thật. Lọc khung HDR chờ video nguồn.
- Bên OpenMausBot: lần trước tạo nhân viên Tuyết Nhi cho Tiêu Băng gặp lỗi 403 Cloudflare/API, chưa rõ đã tạo được chưa. Phải kiểm cấu hình thật trước, không tạo trùng.

## Nguồn

- TikTok photo post: https://developers.tiktok.com/doc/content-posting-api-reference-photo-post
- TikTok audit: https://developers.tiktok.com/doc/content-posting-api-get-started
- Threads posts: https://developers.facebook.com/docs/threads/posts/
- Postiz TikTok: https://docs.postiz.com/public-api/providers/tiktok.md
