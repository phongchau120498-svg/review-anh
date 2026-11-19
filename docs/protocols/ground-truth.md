# Ground Truth

Cập nhật 19/11/2026. Hiện trạng đã kiểm. Thiết kế xem [Blueprint](../BLUEPRINT.md).

## Mục đích

Dựng bộ ảnh review dọc 9:16 có chữ tiếng Việt từ kho ảnh sản phẩm, theo bộ quy tắc brand dùng chung cho mọi agent.

## Stack và cách chạy (đã kiểm)

- Node.js (máy anh dùng v26), ImageMagick 7 có HEIC, FFmpeg, Playwright Chromium, util-linux `flock`, Gitleaks 8.30.1. Cài theo README, mục "Cài trên máy".
- Lệnh chính:
  - `tools/bang-nguon.sh <sp> [trang|--tat-ca|--uu-tien]`: bảng xem nguồn cắt 9:16 và có vạch vùng chữ. Bảng thường có tối đa 40 ảnh mỗi trang. Xem [cách dùng bảng ưu tiên](../../README.md#xem-và-lọc-ảnh-nguồn).
  - `node tools/dung-bo-anh.mjs [--trai-nghiem] nguon/<sp>/bo-anh.json`: dựng bộ ảnh.
  - `node tools/soat-chu.mjs [--ban-hang] nguon/<sp>/bo-anh.json`: kiểm chữ trên slide, có tùy chọn kiểm caption của lượt dựng. Xem [cú pháp trong README](../../README.md#dựng-bộ-ảnh).
  - `tools/drive-kho.sh dong-bo|tai|khung`: lấy nguồn từ Drive.
  - `tools/giao-viec.sh <sp> [ghi chú]`: giao việc cho Claude Code headless, kiểm cả caption trước khi trả kết quả.
- Quality gate: `npm test`, gồm fixture OpenMausBot nên cần `../OpenMausBot`. Thay đổi nhỏ chạy test hẹp của phần sửa: `node --test tools/<file>.test.mjs mcp/server.test.mjs`.
- Repo: GitHub private `phongchau120498-svg/review-anh`, nhánh `main`.

## Sự thật đã xác minh

- **Kho Moaw Moaws:** 485 ảnh tải về, gồm 419 ảnh sản phẩm/body và 66 slide đã đăng. 8 thư mục sản phẩm. Khoảng 800 video thô chỉ có trong mục lục. Kiểm ngày 19/11: `dong-bo` báo "Đã có 485, vừa tải 0, lỗi 0".
- **Drive gốc** `[G] VIDEO` của tài khoản `ai.stellakinetics` để chế độ ai có link cũng xem. Tài khoản đã hết dung lượng: tải về được, tải lên không được.
- **Bot trên `bot.onehand.space`** (Docker Compose `mausbot` trên Dokploy, project `onhand-bot`):
  - mượn được thư mục và terminal của PC anh qua `shared_computer`;
  - **không** chạy được MCP trên PC (`lentMcpRefusal` chỉ cho Cloud riêng);
  - **không** tự xem ảnh qua `read_file` (trả base64);
  - không dùng được Computer control vì PC chạy Wayland.
- **Thu Trinh** gửi được ảnh trong `ra/` vào chat bằng cách `read_file` → ghi workspace → `attach_file`. Ảnh hardlink trong `nguon/` thì `read_file` từ chối.
- **Claude Code headless** do `giao-viec` gọi chạy trong dịch vụ systemd của user (AppArmor chặn `unshare`). Lệnh dựng chạy trong Bubblewrap không mạng. Số vòng, thời gian và số đếm theo bước của các lượt Body Oil nằm ở [Tracking T-12](tracking.md#t-12--tối-ưu-brand-và-quy-trình).
- **Claude Code trong repo** đã chạy `/lam-bo-anh` trên ba ca Moaw và gọi agent Haiku chỉ đọc khi có bản dựng. `/them-brand` đã tạo đủ khung cho một brand thử và gọi soát. Kết quả chất lượng từng ca và số đo lượt headless nằm ở [Tracking T-12](tracking.md#t-12--tối-ưu-brand-và-quy-trình).

## Giả định (chưa kiểm)

- Máy khác (sếp) cài theo README là chạy được. Chưa thử trên máy thứ hai.
- Đường làm nhanh và lượt góp ý thật của người dùng qua skill hoặc chat Thu Trinh còn chờ kiểm. Xem [Tracking](tracking.md).

## Ràng buộc còn hiệu lực

Xem [Security](security.md) và mục "Luật cứng" trong [AGENTS.md](../../AGENTS.md).

## Nguồn đối chiếu

`git log`, [plan thử chuỗi ảnh](../../plans/261117-1437-lam-thu-chuoi-anh-review/plan.md), [plan giao việc](../../plans/261118-1610-thu-trinh-giao-viec-claude-code/plan.md), [kho nguồn](../kho-nguon.md), mã nguồn OpenMausBot (đọc, không sửa).
