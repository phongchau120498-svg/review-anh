# Cách nghĩ một bộ ảnh (dùng chung mọi brand)

Cập nhật 19/11/2026. Đọc cùng `thuong-hieu.md` và `giong-van.md` trong thư mục brand của sản phẩm, xem [cách xác định brand](../../them-brand-san-pham-nguon.md). Ví dụ trong file này lấy từ Moaw Moaws; brand khác thay bằng ví dụ của brand đó trong `giong-van.md`.

## 1. Chốt một góc, chỉ một

Mỗi bộ trả lời **một** câu hỏi của người xem. Chọn từ ghi chú của người dùng. Nếu không có, chọn một trong các dạng sau (ví dụ của Moaw Moaws):

| Dạng | Khi dùng | Ví dụ đã đăng |
|---|---|---|
| Review trải nghiệm | Mặc định cho bản nháp | Cảm nhận chất dầu, mùi, da sau khi thoa |
| Nên & không nên (❌/✓) | Sản phẩm dễ dùng sai | "Nên & không nên khi ủ bột trắng da" |
| Cách dùng đúng, đánh số 1–2–3 | Sản phẩm mới, người xem chưa biết dùng | "1 Dùng sau khi tắm / 2 Thoa oil theo vùng / 3 Kết hợp oil & lotion" |
| Công thức | Bột ủ, pha trộn | "Công thức: 3–4 muỗng bột + sckd + 2–3 giọt body oil" |
| Lịch chăm da 7 ngày (Day 1–7) | Combo nhiều sản phẩm | "Lịch chăm da body sáng mịn" |
| So sánh hai sản phẩm | Hai sản phẩm cùng dòng | "Love oil: da khô, muốn thơm / Body oil: da khô, thâm sần" |
| Meme/đối lập | Bài nhẹ, kéo tương tác | "Khi chưa có anh iu / Khi đã có anh iu" |

## 2. Cấu trúc 3–4 slide

1. **Bìa** (`mau: "bia"`): hook trong `tieu_de` (tối đa khoảng 8–10 chữ, xuống dòng bằng `\n` khi cần), `phu` là một dòng ngắn nói bộ này về gì. Ảnh rõ sản phẩm hoặc kết quả da đẹp nhất.
2. **Chi tiết** (`mau: "chi-tiet"`), 2–3 slide: mỗi slide **một ý**. `tieu_de` là ý chính, `y` là 2–3 dòng giải thích ngắn. Ảnh minh họa đúng ý đó (texture khi nói chất, chai cận khi nói mùi, da khi nói kết quả).
3. Slide cuối chốt nhẹ: mẹo dùng, tần suất hoặc câu rủ. Không có giá/link trong bản review trải nghiệm.

## 3. Chọn ảnh

- Nét, đủ sáng, thấy rõ sản phẩm hoặc da. Mỗi slide một góc khác nhau.
- Chữ nằm giữa ảnh, nên **chọn ảnh có sản phẩm lệch khỏi giữa khung** để chữ không đè lên chai.
- Không dùng ảnh đã chèn chữ sẵn, ảnh chụp màn hình, ảnh mặt người nhìn rõ trừ khi anh cho phép.
- Ảnh không có sản phẩm (body, không gian) nằm trong `nguon/_kho/` của brand, ví dụ `nguon/_kho/body-chung/` của Moaw Moaws. Muốn dùng thì hỏi người dùng để hardlink vào thư mục sản phẩm trước.

## 4. Tự soát trước khi trình

- [ ] Cả bộ trả lời đúng một câu hỏi, slide nào cũng phục vụ câu đó.
- [ ] Đọc to lên nghe như cô bạn nói chuyện, không như tờ quảng cáo.
- [ ] Không có lời hứa trong mục "Mặc định tránh", không bịa trải nghiệm.
- [ ] Tên sản phẩm đúng như bảng trong `thuong-hieu.md` của brand.
- [ ] Chính tả tiếng Việt đúng (trừ chữ cố ý chơi như "troắng"). Chữ không tràn, không đè sản phẩm.
- [ ] Mỗi ảnh có lý do chọn một câu. Caption Threads ≤ 500 ký tự, tiêu đề TikTok ≤ 90 ký tự.

## Khi anh góp ý

Ghi lại góp ý thành quy tắc mới nếu nó áp cho mọi bộ sau (ví dụ "đừng dùng chữ X"): đề xuất người dùng thêm vào file brand tương ứng (riêng brand vào `docs/brand/<brand>/`, mọi brand vào file này), **không tự sửa** file brand. Góp ý chỉ cho bộ hiện tại thì sửa bộ đó rồi dựng lại.
