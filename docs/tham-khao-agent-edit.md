# Tham khảo: Agent Edit (editagent-kp3)

Đọc ngày 17/11/2026 từ bản zip `editagent-kp3-main`, chỉ đọc chứ không chạy. Bản zip nằm ở thư mục Downloads của máy Linux, không có trong repo này.

Agent Edit là app Electron cho macOS: AI đọc video nguồn, lập kế hoạch dựng, rồi render MP4 1080x1920 bằng Remotion. Nó làm video, còn mình làm ảnh tĩnh, nên chỉ mượn được phần đọc hiểu video và chuẩn bị tư liệu.

**Bản quyền:** repo không có file LICENSE. Chỉ lấy ý rồi tự viết lại, không chép code, trừ khi chủ repo cho phép. Bộ font SVN-Gilroy kèm theo là font thương mại, muốn dùng trên ảnh đăng công khai thì cần license.

## Nên lấy

### 1. AI xem video và trả mốc giờ

- File gốc: `capcut-ai-studio/sidecar/providers.py`, prompt `_GEMINI_SOURCES_PROMPT` và hàm `gemini_understand_sources`.
- Gemini xem video và trả về JSON theo schema cố định. Mỗi nguồn có các trường sau:
  - `summary` và `role` (talking_head, broll, product…);
  - `quality.visual`: good, usable hoặc poor;
  - `key_moments`: các khoảnh khắc quan trọng, mỗi cái có `start`/`end` và loại (hook, reveal…);
  - `faces_region`: vùng có mặt người, để tránh đặt chữ đè lên;
  - `warnings`: rung, tối, mất nét…
- Prompt cấm bịa: không chắc thì ghi "không rõ".
- Cách dùng cho mình: đổi đề bài thành "chọn 6–8 giây có khung đẹp nhất: nét, thấy rõ sản phẩm, mỗi khung một góc khác nhau, kèm lý do", rồi FFmpeg cắt đúng các giây đó. Cách này thay cho việc chia đều theo thời lượng trong `khung`.

### 2. Nén video trước khi gửi cho AI

- File gốc: `capcut-ai-studio/sidecar/gemini_media.py`.
- Gemini chỉ xem khoảng 1 khung mỗi giây, nên nén về 720p (vẫn giữ tiếng) gần như không mất thông tin. Họ đo thực tế: 138 MB còn 10 MB. Gemini CLI từ chối file lớn hơn 20 MiB.
- File vẫn quá lớn thì cắt theo dung lượng, lùi điểm cắt về chỗ im lặng gần nhất, cắt bằng stream copy (không nén lại), sau đó ghép kết quả các phần bằng cách cộng thêm giờ bắt đầu của từng phần.
- Video review sản phẩm thường ngắn, nên lúc đầu chỉ cần nén là đủ.

### 3. Chuyển video HDR của iPhone sang SDR trước khi cắt khung

- File gốc: `capcut-ai-studio/sidecar/media_sdr.py`.
- iPhone quay HDR (HEVC 10-bit, BT.2020, HLG/Dolby Vision). Cắt khung thẳng bằng FFmpeg thì ảnh sáng hơn bản chuẩn của Apple khoảng 27 mức (thang 0–255) và nhạt màu.
- Họ chuyển một lần sang bản SDR BT.709, lưu cache, mọi khâu sau dùng chung bản đó. Trên Linux dùng cách dự phòng của họ: FFmpeg `zscale` + tonemap hable (npl=203), lệch khoảng +6 mức so với Apple.
- Nhận biết HDR bằng ffprobe (color transfer `arib-std-b67` hoặc `smpte2084`). Video SDR thì giữ nguyên.

### 4. Gọi AI qua tài khoản đã đăng nhập, không cần API key

- File gốc: `capcut-ai-studio/sidecar/cli_providers.py`, chỉ dùng thư viện chuẩn.
- Chạy CLI chính chủ ở chế độ không giao diện: `claude -p` cho Claude, `codex exec` cho GPT (gửi ảnh kèm bằng `-i`), `agy` cho Gemini qua tài khoản Google. App không đụng tới file đăng nhập.
- Có sẵn các ý nên giữ:
  - nhận diện riêng lỗi hết hạn mức, lỗi chưa đăng nhập, lỗi CLI cũ;
  - lấy khối JSON đầu tiên trong câu trả lời;
  - chạy tối đa 2 lượt cùng lúc để tránh chạm giới hạn tài khoản cá nhân.
- Ghi chú của họ: Gemini CLI không nhận tài khoản cá nhân từ 18/06/2026, nên họ chuyển sang Antigravity CLI.

## Để sau

- **Chữ nghệ thuật bằng AI** (`sidecar/text_art.py`):
  - AI vẽ 3 cụm chữ trên một ảnh nền trong suốt; ảnh đầu tiên làm mẫu phong cách cho các ảnh sau.
  - Code tách từng dòng chữ, rồi OCR so với chữ gốc để bắt lỗi dấu tiếng Việt. Sai thì tạo lại một lần, vẫn sai thì vẽ chữ bằng code.
  - Dùng khi mẫu HTML không đủ đẹp. Ý soát chính tả bằng OCR vẫn nên giữ nếu sau này cho AI vẽ chữ.
- **Tách nền sản phẩm** (`sidecar/media_vision.py`, `lift_subject`): dùng Vision của macOS. Trên Linux thay bằng rembg hoặc thư viện tương đương. Hợp với ảnh bìa có sản phẩm nổi.
- **Tư liệu của người dùng** (`sidecar/user_media.py`): ảnh hoặc video sản phẩm kèm mục đích dùng (chèn thẳng, làm mẫu cho ảnh AI, cách hiển thị). AI mô tả khách quan từng tư liệu, code kiểm lại: giữ đúng tỉ lệ, chữ trong ảnh đủ lớn để đọc, nằm trong vùng an toàn, không đè lên mặt người.
- **Phân tích video mẫu** (`prompt-phan-tich-video-mau.txt`): tách hệ thống dựng (nhịp, chữ, đồ họa, màu) ra khỏi nội dung video mẫu. Có thể đổi thành "phân tích một bài TikTok dạng ảnh mẫu để lấy phong cách chữ và bố cục".
- **Cache theo dấu vân tay của prompt** (`sidecar/step_cache.py`): chạy lại bước AI với cùng đầu vào thì dùng lại kết quả cũ, đỡ tốn lượt gọi.

## Không dùng

App Electron, Keychain, Remotion render video, phần CapCut cũ (`CapCutAPI/`, các script `build_*`, `deploy_to_capcut.py`), và các tính năng chỉ chạy trên macOS (Vision, `avconvert`).
