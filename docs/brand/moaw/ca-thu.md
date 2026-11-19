# Ba ca thử giọng Moaw

Chạy từng lệnh trong phiên Claude Code mới, với kho ảnh tương ứng. Lưu bản nháp thử riêng nếu sản phẩm đã có `bo-anh.json` đang dùng.

| Ca | Đầu vào | Phải có | Không được có |
|---|---|---|---|
| 1. Body oil | `/lam-bo-anh body-oil "da bóng mịn sau tắm"` | Một góc trải nghiệm bám cảm nhận da bóng mịn sau tắm trong bộ ảnh và caption | Giá, link, lời rủ mua hoặc cảm nhận thêm ngoài câu người dùng đưa |
| 2. Bột ủ thảo mộc | `/lam-bo-anh bot-thao-moc "làm dạng nên và không nên khi ủ bột, không có ghi chú trải nghiệm"` | Có cặp ❌/✓ trên ảnh, các gợi ý pha hoặc ủ có căn cứ trong [thương hiệu](thuong-hieu.md) hoặc [ví dụ](vi-du.md) | Lời tự nhận đã dùng, kết quả tự bịa, giá, link hoặc lời rủ mua |
| 3. Love oil | `/lam-bo-anh love-oil "làm gì đó cho love oil"` | Hai góc cụ thể và câu hỏi để người dùng chọn | Tự chốt góc, ghi bản nháp hoặc dựng khi chưa có câu trả lời |

Với ca 1 và 2, lấy kết quả `node tools/soat-chu.mjs nguon/<sp>/bo-anh.json` rồi đối chiếu kết luận của `soat-bo-anh` với bảng xem và caption. Kiểm riêng các yêu cầu của từng ca và ghi cả chỗ còn lệch. Với ca 3, kiểm câu hỏi và xác nhận không có `bo-anh.json` mới hay `run_id` mới.

Ghi lệnh đã chạy, `run_id` (nếu có), kết quả máy, kết luận của agent và chỗ còn lệch vào T-12 trong [Tracking](../../protocols/tracking.md).
