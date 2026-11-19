# Tracelog

Nhật ký mốc, quyết định và sự cố, mới nhất ở trên. Chi tiết nằm trong commit và plan được dẫn.

## 2026-11-19

- **Khởi tạo bộ protocol.** Tạo [Blueprint](../BLUEPRINT.md), sáu file trong `docs/protocols/`, cập nhật `AGENTS.md`. Nguồn: lịch sử Git, hai plan, HANDOFF.
- **Cấu trúc đa brand.** Anh hỏi cách thêm brand, sản phẩm, nguồn. Đã chốt:
  - brand là tiền tố của mã sản phẩm;
  - bộ brand chia thành `docs/brand/chung/` và `docs/brand/<brand>/`;
  - mỗi brand một mục lục `kho/<brand>.tsv`.

  Lý do: không phải sửa code kiểm đường dẫn, MCP và test như khi lồng thư mục. Quy trình ở [hướng dẫn thêm brand](../them-brand-san-pham-nguon.md). Đổi tên sản phẩm Moaw cũ còn chờ anh (T-06).
- **Bộ brand Moaw Moaws.** Rút từ 66 slide thương hiệu đã đăng và lời anh: "giọng khách review chân thật, không kê công dụng kiểu PR, giữ nhẹ brand". Claim "x2 trắng", "trị viêm" để mặc định tránh, chờ anh chốt (T-02).
- **Lệnh dùng chung cho mọi agent.** Thêm `AGENTS.md`, `CLAUDE.md` (`@AGENTS.md`), skill `/lam-bo-anh` và `tools/drive-kho.sh dong-bo`. Prompt của `giao-viec` đọc cùng bộ brand.
  - Sự cố đã sửa: `read` với IFS=tab gộp các cột trống, làm bỏ sót 66 slide; đã đổi sang ký tự ngăn `\037`.
- **Review trải nghiệm và sửa AppArmor** (`162cbfc`):
  - AppArmor chặn `unshare` khi chạy qua terminal mượn, nên chuyển sang dịch vụ systemd của user;
  - thêm `--trai-nghiem` (không cần brief, cấm giá và link).
- Kiểm: test hẹp 22/22; `dong-bo` 485/0 lỗi; giả lập máy mới.

## 2026-11-18

- **Thu Trinh giao việc cho Claude Code trên PC** (`5a77ee1`, `e4efe25`). Bot không tự xem được ảnh, nên giao việc chọn ảnh và dựng cho Claude Code headless, rồi gửi ảnh về chat bằng `attach_file`. Chi tiết ở [plan giao việc](../../plans/261118-1610-thu-trinh-giao-viec-claude-code/plan.md).
- **Đường đã thử và thất bại:**
  - MCP `review-anh-pc` qua máy mượn → "MCP servers run here only for the person's own Clouds";
  - `read_file` ảnh → bot chỉ thấy base64;
  - Computer control → bị chặn trên Wayland, Ubuntu 26.04 không còn phiên Xorg;
  - "Bot's screen → This computer" → bị ẩn trên trang server.
- **Kho Moaw Moaws** (`9de300a`): xếp Drive `[G] VIDEO` theo sản phẩm, có mục lục, phân trang `view_bang_anh_nguon`, sửa 218 file sai đuôi.
- Sự cố: phiên Claude Code lỡ in secret mượn máy ra transcript. Đã báo anh.

## 2026-11-17

- Chốt kiến trúc: MausBot là não, repo là tay chân, đăng qua Postiz (`8f90f09`). Plan được red-team review, 15 phát hiện (`906a324`).
- Dựng ảnh từ mẫu HTML an toàn (`9862c7e`), MCP server (`ec71aa1`), Postiz local (`399abae`). Kiểm chung `npm test` 27/27 (`cb089fe`, `388a8c9`).
- Mẫu đổi sang chữ trắng viền đen trên ảnh tràn viền theo góp ý (`717e093`).
- Thu Trinh trên `bot.onehand.space` không gọi được MCP trên PC (`81ca046`).
