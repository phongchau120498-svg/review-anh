# Tracking

Cập nhật 19/11/2026. Trạng thái: **chưa làm / đang làm / đã kiểm chứng / bị chặn**. Chỉ ghi "đã kiểm chứng" khi có bằng chứng đạt điều kiện xong. Lịch sử và lý do ở [Tracelog](tracelog.md). Chi tiết chặng nằm trong plan được dẫn.

| Mã | Mục tiêu | Trạng thái | Phụ trách | Phụ thuộc / trở ngại | Điều kiện xong | Bằng chứng |
|---|---|---|---|---|---|---|
| T-01 | Thu Trinh làm trọn bộ Body Oil từ chat ([plan giao việc](../../plans/261118-1610-thu-trinh-giao-viec-claude-code/plan.md), phase 3) | đang làm | anh + phiên sau | Anh có mặt, PC mở OpenMausBot | Anh nhắn "làm bộ Body Oil", bảng xem và từng ảnh hiện trong chat, anh không phải kéo ảnh | Thử cục bộ qua `sharedCommand` ra 3 JPEG trong 40,4 s (19/11). Lượt từ chat chưa chạy |
| T-02 | Điền ô **CẦN CHỐT** brand Moaw (khách hàng, sản phẩm túi và chai nhỏ, mức "trắng" được nói) | chưa làm, chờ user chốt | anh/sếp | — | `docs/brand/moaw/thuong-hieu.md` không còn ô CẦN CHỐT | — |
| T-03 | `brief.json` có giá và link cho sản phẩm bán hàng | chưa làm, chờ user chốt | anh | Giá và link thật | `list_nguon` đọc được brief của sản phẩm | — |
| T-04 | Tắt entry MCP `review-anh-pc` trên server | chưa làm, chờ user | anh | Phải đăng nhập server | Thu Trinh không còn gọi MCP lỗi | — |
| T-05 | MCP chạy trên máy chủ bot để bot tự xem và dựng ([plan thử chuỗi](../../plans/261117-1437-lam-thu-chuoi-anh-review/plan.md), phase 6) | bị chặn | phiên sau | Xác nhận quyền project `onhand-bot`, image `omb` thiếu công cụ | Bot gọi `view_bang_anh_nguon` và `dung_bo_anh` thành công trên server | Kiểm chỉ đọc Dokploy 18/11 |
| T-06 | Đổi tên sản phẩm Moaw cũ sang tiền tố `moaw-` | chưa làm, chờ user chốt | — | Nên làm trước khi bàn giao | Mọi thư mục, mục lục, tài liệu dùng `moaw-…`; test hẹp đạt | — |
| T-07 | Đăng qua Postiz (Threads, TikTok riêng tư) (plan thử chuỗi, phase 5–6) | bị chặn | — | Tài khoản thử, Cloudflare/domain | Bài thật trên tài khoản thử, kiểm trên app | Cấu hình local đã kiểm 17/11 |
| T-08 | Phân loại khoảng 800 video thô `ACTION SP`, `SHOW/CHẠM DA` | chưa làm | — | — | Cột `san_pham` trong `kho/moaw.tsv` có giá trị cho các video cần dùng | — |
| T-09 | Kiểu chữ trên ảnh theo brand (hộp trắng mờ, chữ có chân như slide Moaw) | chưa làm, chờ user chốt | — | Quyết định thiết kế | Anh duyệt mẫu mới | — |
| T-10 | Bộ brand dùng chung, `/lam-bo-anh`, `dong-bo`, cấu trúc đa brand, bộ protocol | đang làm | Claude Code (phiên 19/11) | — | Test hẹp đạt, `dong-bo` chạy trên máy mới, `/lam-bo-anh` ra một bộ thật trong phiên mới | `node --test tools/*.test.mjs mcp/server.test.mjs` 22/22; `dong-bo` 485 có sẵn / 0 lỗi; giả lập máy mới tải 3 ảnh đúng (19/11). `/lam-bo-anh` chưa chạy thật |
| T-11 | Bàn giao repo cho công ty: chuyển sang tổ chức, máy dùng chung | chưa làm, chờ user chốt | anh | T-02, T-06 | Sếp clone, cài, chạy `dong-bo` và `/lam-bo-anh` trên máy sếp | — |

## Nợ kỹ thuật

- `brandOf` trong `tools/giao-viec.mjs` mới được test với brand mặc định. Chưa có test cho sản phẩm có tiền tố brand khác.
- `read_file` của MausBot từ chối file hardlink, nên bot không gửi được ảnh gốc trong `nguon/`, chỉ gửi được ảnh trong `ra/`.
- Bảng xem 40 ảnh HEIC tốn khoảng 2,5 GB RAM cho magick. Cần tính khi chạy trên máy chủ nhỏ.
- `dong-bo` chỉ tải được nguồn Drive công khai.
