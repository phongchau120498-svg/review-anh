# HANDOFF

Cập nhật lần cuối: 2026-11-18 — Claude Code

## Kho nguồn Moaw Moaws trên PC · nhánh: `main` · cập nhật: 2026-11-18

- Đã xếp kho Drive `[G] VIDEO` vào `nguon/` theo [kho nguồn](docs/kho-nguon.md): 8 thư mục sản phẩm (hardlink từ `nguon/_kho/`), mục lục `nguon/_kho/muc-luc.tsv` đủ 1.424 file Drive. `view_bang_anh_nguon` thêm `trang` (40 ảnh/trang).
- Chờ anh: điền `brief.nhap.json` (giá, link, domain, 3 điểm nổi bật) rồi đổi tên `brief.json`; xác nhận tên bộ chai nhỏ (Sunkissed?). Không tự bịa giá/công dụng.
- Chưa làm: phân loại ~800 video thô `ACTION SP`/`SHOW/CHẠM DA` (lấy khung theo `drive_id` bằng `tools/drive-kho.sh khung` khi cần); tuýp sữa gạo/gel AHA-BHA chỉ 3 ảnh nên chưa có thư mục.
- Lưu ý: bảng xem 40 ảnh HEIC tốn ~2,5 GB RAM cho magick; cân nhắc trước khi chạy trên máy chủ nhỏ.

## MCP cho Thu Trinh trên máy chủ riêng · phụ trách: phiên tiếp theo · nhánh: `main` · cập nhật: 2026-11-17

- Mục tiêu: Thu Trinh trên `https://bot.onehand.space/` dùng MCP xem nguồn và dựng ảnh dọc 9:16; chỉ bản nháp chờ duyệt. Anh chọn chuẩn bị MCP chạy cùng máy chủ MausBot, rồi yêu cầu dừng và bàn giao để tối làm tiếp.
- Chặng hiện tại: chưa triển khai gói chạy trên máy chủ. Đọc quyết định bổ sung trong [plan](plans/261117-1437-lam-thu-chuoi-anh-review/plan.md) và bằng chứng kết nối trong [Kết quả phase 6](plans/261117-1437-lam-thu-chuoi-anh-review/phase-06-noi-mausbot-va-chay-tron-mot-san-pham.md), mốc `81ca046`. Không tạo thêm bot hay cố định lại quyền sáu bot cũ.
- Dở dang chưa commit: không còn code hoặc thay đổi dở chưa commit. Code triển khai MCP trên host chưa bắt đầu. Scaffold phase thử tạo đã dọn, không để stub rỗng.
- Tiếp theo:
  1. Đã kiểm chỉ đọc qua MCP `lowbit-dokploy` (18/11): `bot.onehand.space` là **Docker Compose trên Dokploy**, project `onhand-bot`, compose `mausbot` (2 service `omb` + `caddy`; domain trỏ `caddy`). Service `omb` mount volume `onhand-mausbot_data` vào `/data` và `..._edge` vào `/run/openmausbot`. Mô tả project trên Dokploy ghi "owner: project owner friend; do not edit other projects" — xác nhận với anh ai sở hữu trước khi ghi gì vào compose/volume. Chưa kiểm image `omb` có Node/Chromium/ImageMagick/FFmpeg không. Không cần SSH để kiểm tiếp; không yêu cầu mật khẩu/private key trong chat.
  2. Ưu tiên tái sử dụng `mcp/server.mjs` qua stdio ngay trong môi trường MausBot nếu khả thi; cần chế độ chỉ có `list_nguon`, `view_bang_anh_nguon`, `dung_bo_anh`. Nếu khác container thì kiểm mount/network thực tế trước khi chọn HTTP loopback. Không mặc định viết thêm HTTP, reverse proxy hay tunnel.
  3. Chuẩn bị cấu hình chạy, thư mục nguồn/đầu ra, quy trình đưa ảnh/brief lên host và rollback; khóa/ảnh/log nằm ngoài Git. Không chép đăng nhập engine. Không mặc định coi `nguon/` trên PC đã có trên host.
  4. Khi cần code, cập nhật plan hiện có; mỗi phase một agent mới ngữ cảnh sạch, writer test hẹp và ghi lệnh/kết quả, một review độc lập + gate chung khi xong. Tái sử dụng dependencies exact và lockfile, không sửa code OpenMausBot. Trình gói cụ thể trước bước deploy; chưa có quyền deploy từ câu chọn phương án.
  5. Sau khi triển khai được duyệt: sửa kết nối của riêng Thu Trinh sang endpoint/lệnh trên host; giữ Ask, xác nhận chỉ ba tool; thử list → bảng nguồn → dựng bộ MẪU và kiểm kết quả từ chính bot. Local pass không thay thế bằng chứng này.
- Blocker: thiếu thông tin và quyền kiểm máy chủ; đường lent MCP từ máy chủ riêng xuống PC bị chặn. Các bước đăng Postiz còn chờ tài khoản thử, domain và brief theo plan gốc, không kéo vào công việc draft này.
- Ràng buộc/không được đụng: giữ nguyên Red Team Review và Ngoại lệ trong plan; model Claude Sonnet 5 của Thu Trinh; Ask; chỉ Thu Trinh có MCP draft. Không tự bật lại entry `review-anh` đang trỏ MacBook; entry cấu hình PC là `review-anh-pc`. Không sửa/migrate home của MausBot, không nâng Full access, không nối Postiz, không đăng/lên lịch. Cấm push/deploy tự phát về sau; lần push này đã được anh giao rõ.
- Đã thử, thất bại:
  - Nút Kiểm tra và yêu cầu `list_nguon` từ Thu Trinh qua PC cùng trả `MCP servers run here only for the person's own Clouds`. Nguồn kiểm chỉ đọc: `OpenMausBot/electron/lent-mcp.mjs`, hàm `lentMcpRefusal`, kiểm `grant.cloud`. Không đổi cờ grant hoặc đi vòng qua chặn này.
  - Apps tự chọn MacBook khi thêm URL loopback; không dùng lại entry đó để thử PC.
  - `ck plan add-phase ... --after 6` lỗi `afterId.toLowerCase is not a function`; không có `--after` lại lấy ID 16 do bảng Red Team có số 1–15. Scaffold đã dọn. Đọc kết quả CLI trước khi nhận số phase, không sửa CLI/OpenMausBot để né.
- Kiểm tra: bằng chứng/lệnh và giới hạn ở Kết quả phase 6, commit `81ca046`. Code chưa đổi sau kiểm đó; chưa test triển khai trên host, chưa đạt luồng từ Thu Trinh tới ảnh. Gate toàn repo cũ và review nằm trong mục Kiểm chung của plan; không chạy lại nếu chưa có code/môi trường liên quan đổi.
- Runtime local để chẩn đoán nếu cần: user service `review-anh-mcp-local` là transient; `ra/.thu-trinh-mcp/serve.mjs`, cấu hình `ra/.thu-trinh-mcp/cau-hinh-mausbot.json` quyền 0600 và ảnh bằng chứng cùng thư mục đều ignored. Không in nội dung cấu hình/khóa. Các file này cùng `nguon/`, `ra/` không đi theo Git sang máy khác; chưa phải gói triển khai server.
- Task: Tracking `/root — Thu Trinh` trong plan; phạm vi bàn giao là chuẩn bị kết nối máy chủ, không đánh dấu toàn bộ phase 6 hoàn tất.
