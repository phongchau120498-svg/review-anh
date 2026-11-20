# Tracelog

Nhật ký mốc, quyết định và sự cố, mới nhất ở trên. Chi tiết nằm trong commit và plan được dẫn.

## 2026-11-20

- **Chặn chữ che nhãn trong bản dựng trải nghiệm.** Vạch trên bảng nguồn giúp chọn ảnh nhưng ba lượt thật vẫn dùng thêm bảng và hai bộ còn lỗi. Dùng vùng bảo vệ đánh dấu trên các ảnh đã xem để renderer báo chính xác slide cần đổi. Headless tạo bảng ưu tiên trước để bỏ một lượt gọi công cụ và đo toàn thời gian chuẩn bị. Bằng chứng kiểm cục bộ và phần nghiệm thu còn mở ở [Tracking T-12](tracking.md#kiểm-cục-bộ-vùng-bảo-vệ-và-chuẩn-bị-bảng).
- **Soát đúng lượt dựng.** Lưu bản chữ đã dựng cạnh caption và bảng xem để lượt soát tiếp tục dùng nội dung cũ nếu draft nguồn đã đổi. Anh chọn chốt triển khai trước, nghiệm thu sau. Các bước còn lại nằm trong [plan](../../plans/261119-1530-toi-uu-brand-va-quy-trinh/plan.md#nghiệm-thu-sau-triển-khai).

## 2026-11-19

- **Duyệt thử bảng chọn ảnh 9:16 và đo theo bước.** Anh chọn giữ mẫu slide và model mặc định. Bảng nguồn cắt giữa giống khung dựng rồi kẻ vạch cho chữ bìa và chi tiết. Body Oil có trang ưu tiên để thử giảm lượt mở bảng, kèm đường xem toàn kho. Bộ đếm phân biệt thao tác được phép, lần dựng thành công và lần bị từ chối, vì tổng `num_turns` trong log cũ chưa đủ để phân tích nguyên nhân. Xem [bằng chứng T-12](tracking.md#đo-lại-với-bảng-916).

- **Tối ưu bộ brand và quy trình.** Sáu phase triển khai từ `73f4a62` đến `7002deb`. [Tracking T-12](tracking.md#t-12--tối-ưu-brand-và-quy-trình) giữ kết quả từng ca và số đo.
  - Mượn khung giọng cố định, tông theo chỗ đặt chữ, cặp ví dụ và agent chỉ đọc từ [Anthropic brand-voice](https://github.com/anthropics/knowledge-work-plugins/tree/main/partner-built/brand-voice). Khung giúp người viết và người soát dùng cùng tiêu chí. Chữ Moaw vẫn lấy từ bài đã đăng và thông tin anh xác nhận.
  - Mượn danh sách cụm sáo cấm từ [ECC](https://github.com/affaan-m/ecc) để soát được bằng máy. Tách cụm dùng chung và cụm riêng để mỗi brand chỉnh đúng phạm vi.
  - Mượn việc lưu phản hồi và hàng chờ duyệt từ viraloop và slidelot. Giữ bằng chứng theo `run_id` và chờ anh chốt trước khi cập nhật quy tắc. Xem [tài liệu tham khảo](../tham-khao-mau-thiet-ke.md).
  - Dùng cách kiểm từ *AI Agent* (skill `agentbook`). Giữ ít mẫu nhưng phủ tình huống khác nhau, đưa điều kiện rõ ràng vào code, để người soát độc lập và dùng phản hồi lặp lại làm căn cứ đề xuất. Ghép quy tắc cố định trước bài học và ghi chú để tận dụng cache. Xem [nguồn và lý do trong plan](../../plans/261119-1530-toi-uu-brand-va-quy-trinh/plan.md).
- **Năm mặc định đã áp dụng** theo [câu hỏi mở trong plan](../../plans/261119-1530-toi-uu-brand-va-quy-trinh/plan.md#câu-hỏi-mở-có-khuyến-nghị).
  1. Agent đọc và soát dùng **Haiku**, theo mẫu Anthropic và để giảm chi phí. Giữ đến khi có bằng chứng agent bỏ sót lỗi giọng tiếng Việt.
  2. `/lam-bo-anh` **bật soát độc lập mặc định** để đối chiếu với người viết. Khi anh yêu cầu làm nhanh, bỏ lời gọi agent và vẫn chạy soát máy.
  3. Chữ quá dài **chỉ cảnh báo** để người viết cân theo bố cục. Renderer chặn khi chữ thực tế tràn.
  4. Các cụm Moaw mặc định tránh được đưa vào [`cam.txt`](../brand/moaw/cam.txt) để chặn tới khi anh xác nhận lại ở T-02. Bỏ dòng tương ứng nếu anh duyệt cho dùng.
  5. Thêm tùy chọn `GIAO_VIEC_MODEL` để đo thử model khác khi anh chọn. Biến chưa đặt giữ model Claude Code hiện tại.
- **Review và gate cuối plan.** Bổ sung soát caption bằng máy cho cả đường làm nhanh và giữ tên riêng cho bảng chứa toàn bộ nguồn. Kiểm toàn repo đạt 44/44. Hai ca dựng chạy lại vẫn chưa đạt soát độc lập và trung vị số vòng vượt đường cơ sở, nên T-12 tiếp tục mở. Xem [bằng chứng và nợ kỹ thuật](tracking.md#t-12--tối-ưu-brand-và-quy-trình).

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
