# Hướng làm

Cập nhật: 17/11/2026.

## Đầu vào và đầu ra

- Vào: kho ảnh/video sản phẩm quay sẵn; mỗi sản phẩm một thư mục kèm brief ngắn (tên, 3 điểm nổi bật, giá, link).
- Ra: bộ 3–4 ảnh 1080x1920 có chữ, kèm caption, chủ kênh duyệt rồi mới đăng TikTok hoặc Threads.

## Chuỗi xử lý

1. **Lọc khung (rẻ):** video HDR của iPhone chuyển sang SDR trước, rồi FFmpeg lấy 15–20 khung theo chuyển cảnh, bỏ khung mờ. Hiện `khung` mới chia đều theo thời lượng.
2. **Chọn ảnh:** model có thị giác chọn 3–4 khung theo tiêu chí: nét, thấy rõ sản phẩm, mỗi ảnh một góc (tổng thể / cận chi tiết / đang dùng / kết quả). Cách khác: cho AI xem cả video (đã nén 720p) và trả về mốc giây của các khung đẹp nhất. Chi tiết và các ý mượn được nằm trong [tham khảo Agent Edit](tham-khao-agent-edit.md).
3. **Chữ và thiết kế:** dùng 3–4 mẫu HTML/CSS cố định (bìa có câu móc, chi tiết, ưu/nhược, kêu gọi), chụp ra ảnh bằng Playwright. Mẫu cố định giữ phong cách đồng nhất; CSS tự xuống dòng và co chữ nên không tràn. Hiện `chu` dùng ImageMagick, từng bị tràn với dòng dài.
4. **Duyệt:** gửi bảng lưới (`luoi`) cùng caption để chủ kênh duyệt.
5. **Đăng:**
   - Threads: API chính thức cho carousel 2–20 ảnh, 250 bài/24h, ảnh phải có URL công khai.
   - TikTok: Content Posting API có photo post, nhưng app chưa qua audit thì mọi bài đều riêng tư. Giai đoạn đầu đẩy vào nháp (`post_mode` MEDIA_UPLOAD) để thêm nhạc trên app rồi đăng tay; **cần xác minh** chế độ này có dùng được khi app chưa audit không.
   - Không tự động hóa đăng TikTok qua trình duyệt: dễ bị phát hiện bot, có thể mất kênh.

## Giai đoạn

1. Tự động bước 1–3, đăng Threads qua API sau khi duyệt, TikTok qua nháp. Chạy vài tuần để chốt chất lượng.
2. Chọn giữa xin TikTok audit app và dịch vụ đã audit (Ayrshare, Publer, upload-post…, có trả phí). Cân nhắc tự host Postiz (gitroomhq/postiz-app) trên Dokploy làm lớp lịch đăng.
3. Bọc thành MCP server (các tool kiểu `chon_khung`, `dung_bo_anh`, `dang_bai`) để MausBot gọi. Làm sau khi bước 1–3 ổn định, để không phải đổi contract nhiều lần.

## Trạng thái

- Script đã thử trích khung, chèn chữ tiếng Việt, ghép bảng. Ảnh thử cũ nằm trong `ra/thu`, `ra/thu-body-oil`.
- Chưa kiểm được metadata bằng ảnh có EXIF thật. Chưa có phần chọn ảnh tự động, mẫu HTML hay phần đăng.
- Bên OpenMausBot: lần trước tạo nhân viên Tuyết Nhi cho Tiêu Băng gặp lỗi 403 Cloudflare/API, chưa rõ đã tạo được chưa; kiểm cấu hình thật trước, không tạo trùng.

## Nguồn

- TikTok photo post: https://developers.tiktok.com/doc/content-posting-api-reference-photo-post
- TikTok audit: https://developers.tiktok.com/doc/content-posting-api-get-started
- Threads posts: https://developers.facebook.com/docs/threads/posts/
