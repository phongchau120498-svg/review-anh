# Ground Truth

Cập nhật 19/11/2026. Hiện trạng đã kiểm. Thiết kế xem [Blueprint](../BLUEPRINT.md).

## Mục đích

Dựng bộ ảnh review dọc 9:16 có chữ tiếng Việt từ kho ảnh sản phẩm, theo bộ quy tắc brand dùng chung cho mọi agent.

## Stack và cách chạy (đã kiểm)

- Node.js (máy anh dùng v26), ImageMagick 7 có HEIC, FFmpeg, Playwright Chromium, util-linux `flock`, Gitleaks 8.30.1. Cài theo README, mục "Cài trên máy".
- Lệnh chính:
  - `tools/bang-nguon.sh <sp> [trang]`: bảng xem nguồn, 40 ảnh/trang.
  - `node tools/dung-bo-anh.mjs [--trai-nghiem] nguon/<sp>/bo-anh.json`: dựng bộ ảnh.
  - `tools/tiktok-anh.sh kiem <ảnh>`: kiểm chuẩn ảnh.
  - `tools/drive-kho.sh dong-bo|tai|khung`: lấy nguồn từ Drive.
  - `tools/giao-viec.sh <sp> [ghi chú]`: giao việc cho Claude Code headless.
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
- **Claude Code headless** do `giao-viec` gọi chạy trong dịch vụ systemd của user (AppArmor chặn `unshare`). Lệnh dựng chạy trong Bubblewrap không mạng. Một lượt thật mất khoảng 40 giây.

## Giả định (chưa kiểm)

- Skill `/lam-bo-anh` chạy đúng trong một phiên Claude Code mới. Mới kiểm được nội dung, chưa chạy thật.
- Máy khác (sếp) cài theo README là chạy được. Chưa thử trên máy thứ hai.

## Ràng buộc còn hiệu lực

Xem [Security](security.md) và mục "Luật cứng" trong [AGENTS.md](../../AGENTS.md).

## Nguồn đối chiếu

`git log`, [plan thử chuỗi ảnh](../../plans/261117-1437-lam-thu-chuoi-anh-review/plan.md), [plan giao việc](../../plans/261118-1610-thu-trinh-giao-viec-claude-code/plan.md), [kho nguồn](../kho-nguon.md), mã nguồn OpenMausBot (đọc, không sửa).
