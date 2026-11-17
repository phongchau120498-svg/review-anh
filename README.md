# review-anh

Làm series review dạng ảnh (3–4 ảnh có chữ) từ kho ảnh/video sản phẩm quay sẵn, để đăng TikTok (photo mode) và Threads (carousel).

Tách khỏi OpenMausBot để nghiên cứu riêng. Về sau MausBot điều khiển qua MCP.

## Cấu trúc

- `tools/tiktok-anh.sh`: script thử, gồm trích khung, chèn chữ, dựng bảng chọn ảnh, kiểm chuẩn đăng.
- `nguon/`: tư liệu gốc, **không vào Git**.
- `ra/`: ảnh đã làm, **không vào Git**.
- `docs/huong-lam.md`: hướng làm, trạng thái hiện tại, việc tiếp theo.

## Cần cài

FFmpeg/ffprobe, ImageMagick 7 (`magick`), font Noto Sans Bold (đổi bằng `TIKTOK_ANH_FONT`).

## Dùng

```bash
tools/tiktok-anh.sh khung nguon/video.mp4 16      # ra/video/khung-NN.jpg + bang-khung.jpg
tools/tiktok-anh.sh bang nguon                    # nguon/bang-nguon.jpg để chọn ảnh
tools/tiktok-anh.sh chu ra/video/khung-03.jpg ra/bo/1.jpg "Câu móc" tren
tools/tiktok-anh.sh luoi ra/bo/1.jpg ra/bo/2.jpg ra/bo/3.jpg
tools/tiktok-anh.sh kiem ra/bo/*.jpg              # 1080x1920, sRGB, không metadata, < 20 MB
```
