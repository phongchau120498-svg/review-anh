# HANDOFF

Cập nhật lần cuối: 2026-11-19 15:40 — Claude Code

## Bộ brand dùng chung, đa brand và bộ protocol · phụ trách: phiên tiếp theo · nhánh: `main` · cập nhật: 2026-11-19

- Mục tiêu: mọi agent (Claude Code của anh/sếp, Codex, bot) đọc chung một bộ quy tắc brand rồi mới làm; thêm brand, sản phẩm, nguồn mới không phải sửa code. Task T-10 trong [Tracking](docs/protocols/tracking.md).
- Chặng hiện tại: đã viết xong `docs/brand/` (chung + moaw), `AGENTS.md`, `CLAUDE.md`, skill `/lam-bo-anh`, `tools/drive-kho.sh dong-bo`, [hướng dẫn thêm brand](docs/them-brand-san-pham-nguon.md), Blueprint và sáu protocol trong `docs/protocols/`.
- Dở dang chưa commit: **toàn bộ** phần trên, cùng các sửa trong `tools/giao-viec.mjs` (hàm `brandOf`, quyền đọc `docs/brand/chung` và brand của sản phẩm), `tools/giao-viec.test.mjs`, README, `docs/kho-nguon.md`, `docs/huong-dan-thu-trinh-may-linux.md`. Mục lục chuyển từ `nguon/_kho/muc-luc.tsv` sang `kho/moaw.tsv` (vào Git, có `drive_id`). Không đưa `.claude/agent-memory/` vào commit.
- Tiếp theo: 1. Anh duyệt rồi commit. 2. Chạy `/lam-bo-anh body-oil "..."` trong một phiên Claude Code mới để kiểm skill. 3. *(Chờ anh)* T-02 điền ô CẦN CHỐT, T-06 có đổi tên sản phẩm cũ sang `moaw-` không.
- Ràng buộc: brand là tiền tố mã sản phẩm, sản phẩm cũ không có tiền tố là `moaw`. Không lồng `nguon/<brand>/<sp>/` (phải sửa code kiểm đường dẫn).
- Đã thử, thất bại: `read` với IFS=tab gộp cột trống, làm `dong-bo` bỏ sót 66 slide; đã đổi sang ký tự ngăn `\037`.
- Kiểm tra: `node --test tools/*.test.mjs mcp/server.test.mjs` 22/22; `dong-bo` 485 có sẵn / 0 lỗi; giả lập máy mới tải 3 ảnh đúng. Chưa kiểm: `/lam-bo-anh` chạy thật, `npm test` toàn repo, `brandOf` với brand có tiền tố.

## Thu Trinh làm bộ ảnh Moaw Moaws qua máy Linux mượn · phụ trách: anh và phiên tiếp theo · nhánh: `main` · cập nhật: 2026-11-19

- Mục tiêu: anh bàn content với Thu Trinh (bot trên `bot.onehand.space`). Thu Trinh chỉ **điều phối**: giao việc cho Claude Code headless trên PC Linux qua `shared_computer run_command`, rồi gửi ảnh thành phẩm vào chat bằng `attach_file`. Chỉ bản nháp. Upload/đăng và đưa tool lên máy chủ: anh chốt **tính sau**.
- Chặng hiện tại: chờ lượt Body Oil thật qua chat. Xem [hướng dẫn Thu Trinh](docs/huong-dan-thu-trinh-may-linux.md) và [Tracking trong plan](plans/261118-1610-thu-trinh-giao-viec-claude-code/plan.md#tracking).
- Dở dang chưa commit: không (sửa AppArmor và review trải nghiệm đã commit `162cbfc`). `nguon/` và `ra/` ở trên PC Linux được mượn. Khi tiếp tục từ máy khác, giữ OpenMausBot trên PC đó mở để Thu Trinh dùng kho ảnh.
- Tiếp theo:
  1. Gửi lời nhắn mở đầu trong hướng dẫn, giao Thu Trinh dựng Body Oil theo kiểu review trải nghiệm. Dùng ghi chú từ chat nếu có. Thử ảnh về chat và góp ý một lượt theo [phase 3](plans/261118-1610-thu-trinh-giao-viec-claude-code/phase-03-ch-y-th-body-oil.md).
  2. *(Chờ anh)* Tắt entry MCP `review-anh-pc` trên server: Apps → MCP servers → Manage → Turn off.
  3. *(Chờ anh)* Xác nhận tên bộ chai nhỏ (Sunkissed?) và hũ hồng (Radiant White Booster = scrub muối hồng?).
  4. Sau này: phân loại khoảng 800 video thô. Tuýp sữa gạo và gel AHA-BHA mới có 3 ảnh, chưa có thư mục. Xem [kho nguồn](docs/kho-nguon.md).
- Ràng buộc/không được đụng:
  - Máy đã cho `bot.onehand.space` mượn sẵn: thư mục `/home/thanh-phong/CTP DESKTOP` có quyền ghi, terminal và màn hình. Grant `own` nằm trong `~/.config/openmausbot/computer-sharing.json`, nhật ký ở `lending-activity.jsonl`. Không đọc hay in trường `secret` của file đó.
  - Claude Code headless chỉ được gọi qua `tools/giao-viec.sh`, quyền khóa theo phase 1. Không cho nó git, mạng, xóa file hay ghi ngoài `ra/` và `nguon/<sp>/bo-anh.json`. Chế độ review trải nghiệm chỉ dùng cho bản nháp. Các đường đăng vẫn kiểm brief đầy đủ.
  - Bot dùng máy qua tool server `list_shared_computers` và `shared_computer` (`run_command`, `read_file`…). Không dùng "Bot's screen → This computer": trên trang server, UI ẩn lựa chọn này (`WorksOnGrid.tsx`). Không dùng MCP mượn từ PC: `lentMcpRefusal` chỉ cho Cloud riêng.
  - Thu Trinh giữ mức Ask, model anh chọn. Không đăng, không upload, không tunnel/deploy, không sửa OpenMausBot hay production `onhand-bot` (Dokploy ghi là project của bạn anh).
  - Kho `nguon/` và `ra/` bị Git ignore. Thư mục sản phẩm là hardlink từ `nguon/_kho/`. 218 file đuôi sai đã đổi theo nội dung thật, nên tên file ở `.HEIC`/`.heic` phân biệt hoa/thường.
- Đã thử, thất bại:
  - `read_file` ảnh qua `shared_computer` → bot chỉ thấy base64 thô, không tự nhìn được (`agents-call.ts` chỉ passthrough `content[]`). Muốn **anh** xem thì ghi file ra workspace rồi `attach_file` (chạy được). Muốn **bot** chọn ảnh thì giao Claude Code trên PC.
  - Computer control → `cua-connection.json`: `linux-wayland-seat-safety-blocked`. GNOME 50 không còn phiên Xorg. Anh đã cài Xfce (có phiên X11) và vào thử, nhưng chưa thử bot trên đó và thấy giao diện xấu. Luồng giao việc không cần X11, đừng đẩy anh sang Xfce.
  - MCP `review-anh-pc` từ server → "MCP servers run here only for the person's own Clouds" (21 lần trong nhật ký). Service `review-anh-mcp-local` đã dừng 15:05. Lệnh chạy lại nằm trong commit `5e5d844` (mục cũ của khối này) nếu cần chẩn đoán.
  - Phiên Claude Code trước đã in `secret` của grant mượn máy ra transcript. Đã báo anh; anh có thể tắt rồi bật lại Share this computer. Chưa xác minh làm vậy có đổi secret không.
- Kiểm tra: bằng chứng cục bộ ở [Tracking trong plan](plans/261118-1610-thu-trinh-giao-viec-claude-code/plan.md#tracking). Đường `read_file` → ghi workspace → `attach_file` đã thử riêng với `ra/_bang-nguon/body-oil/trang-1.jpg`. Lượt Body Oil từ chat và vòng góp ý chờ phase 3.
- Task: backlog trong khối này. Plan gốc: [plan](plans/261117-1437-lam-thu-chuoi-anh-review/plan.md).

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
