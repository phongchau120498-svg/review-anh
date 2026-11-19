---
name: them-brand
description: Tạo bộ khung cho thương hiệu mới theo nguồn thật của brand. Dùng khi người dùng gõ /them-brand hoặc nói "thêm brand", "tạo brand mới".
argument-hint: "[tên hoặc mã brand]"
---

# Thêm brand

Đọc `docs/them-brand-san-pham-nguon.md`. Mục “Thêm brand mới” là quy trình chính. Dùng `$ARGUMENTS` và thông tin người dùng đã cung cấp để thực hiện bảy bước trong mục đó.

1. Hỏi một lượt phần còn thiếu theo danh sách ở bước 1. Nếu cần câu trả lời để tiếp tục, chờ người dùng.
2. Kiểm mã và đường dẫn theo bước 2 và mục “Cấu trúc chung”.
3. Gom và đọc bài mẫu theo bước 3. Với slide, xem bảng ghép bằng Read như hướng dẫn.
4. Rút giọng từ bài đã đọc theo bước 4. Dùng các mục của `docs/brand/moaw/giong-van.md` làm khung.
5. Tạo đủ file theo bước 5 và dùng mục “Thêm nguồn mới” để lấy tiêu đề TSV.
6. Gọi Agent với `subagent_type: soat-bo-anh`, ghi rõ chế độ “soát khung brand” và gửi dữ liệu đối chiếu theo bước 6. Xử lý các điểm agent báo theo hướng dẫn.
7. Ghi Knowledge, Tracelog và Tracking rồi trình kết luận và các câu hỏi mở theo bước 7.
