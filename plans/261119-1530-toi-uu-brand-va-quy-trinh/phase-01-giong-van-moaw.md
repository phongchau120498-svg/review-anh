---
phase: 1
title: "Nâng cấp giọng văn Moaw"
status: completed
priority: P1
dependencies: []
---

# Phase 1: Nâng cấp giọng văn Moaw

## Overview

Bổ sung bộ brand Moaw theo mô hình "giọng cố định, tông đổi theo chỗ" (Anthropic brand-voice) và danh sách cấm (ECC). Phase này chỉ sửa tài liệu. Nội dung nháp bên dưới chép từ 66 slide Moaw đã đăng (`nguon/_kho/anh-cuon/`) và lời anh. **Không tự thêm ví dụ hay claim mới**; cần thêm thì đánh dấu CẦN CHỐT.

## Requirements

- **Đặt thông tin quan trọng ở đầu và cuối file** (agentbook, context-engineering): bảng "là / không là" ngay sau mục "Một câu"; tóm tắt các điều cấm ở cuối `giong-van.md`.
- **Ví dụ cố định, ít mà phủ biên:** 2 bộ mẫu đầy đủ cộng 6–8 cặp trước/sau. Không thêm ví dụ na ná nhau.
- **Mỗi ô CẦN CHỐT có khuyến nghị và mức ưu tiên.**

## Related Code Files

- Modify: `docs/brand/moaw/giong-van.md`, `docs/brand/moaw/thuong-hieu.md`
- Create: `docs/brand/moaw/vi-du.md`, `docs/brand/chung/cam.txt`, `docs/brand/moaw/cam.txt`

## Implementation Steps

1. **`giong-van.md`: thêm bảng "Moaw là / Moaw không là"** ngay sau mục "Một câu":

   | Moaw là | Moaw không là |
   |---|---|
   | Thân như bạn thân chỉ mẹo ("mí bà", "nha", "nè") | Suồng sã, thô, chê người đọc |
   | Cụ thể: số giọt, số phút, số lần/tuần, bước làm | Chung chung kiểu "dưỡng da hiệu quả" |
   | Vui, chơi chữ nhẹ ("tế bào *chết*", "troắng") | Lố, meme dày đặc, sai chính tả không chủ đích |
   | Nói cảm nhận thấy được (thấm nhanh, mùi kẹo, da căng bóng) | Đọc thành phần hay công dụng như tờ hướng dẫn |
   | Tự tin về sản phẩm của mình | Hứa quá ("x2 trắng", "trị") hoặc chê brand khác |

2. **`giong-van.md`: thêm mục "Tông theo chỗ đặt chữ"**, thay cho đoạn "Caption" hiện có:

   | Chỗ | Độ dài | Tông | Emoji |
   |---|---|---|---|
   | Bìa: `tieu_de` | ≤ 12 từ, xuống dòng khi cần | Hook: hỏi, đối lập, thoại | 0–1 |
   | Bìa: `phu` | ≤ 10 từ | Nói bộ này về gì | 0 |
   | Chi tiết: `tieu_de` | ≤ 10 từ | Một ý chính | 0–1 |
   | Chi tiết: mỗi `y` | ≤ 14 từ | Mẹo cụ thể, có số khi được | 0–1 |
   | Caption Threads | ≤ 500 ký tự | 2–4 câu kể lại, kết bằng câu hỏi hoặc lời rủ; 2–4 hashtag | 1–2 |
   | Tiêu đề TikTok | ≤ 90 ký tự | Chính là hook | 1 |

   Các ngưỡng này phase 2 dùng làm mức **cảnh báo**.

3. **Tạo `docs/brand/moaw/vi-du.md`**:
   - **Hai bộ mẫu đầy đủ** dạng JSON `bo-anh.json`, chép **nguyên văn** chữ từ slide đã đăng:
     - **Bộ A, dạng "cách dùng đúng":**
       - bìa: "Mua body oil mà mí bà\nđã biết cách xài đúng chưa";
       - chi tiết 1: "Dùng sau khi tắm", ý "Lau khô người, dùng oil liền vì lúc này da còn hơi ẩm" và "Oil thấm nhanh, da mướt mát, căng bóng";
       - chi tiết 2: "Thoa oil theo vùng", ý "Cánh tay 2–3 giọt, chân 3–4 giọt" và "Thấm nhanh & tiết kiệm";
       - chi tiết 3: "Kết hợp oil & lotion", ý "Dùng oil trước, sau 5–10 phút mới tới lotion".
     - **Bộ B, dạng "nên & không nên":** chép từ slide về ủ bột (❌ pha quá lỏng/quá đặc ✓ pha sệt sệt; ❌ ủ quá lâu → khô, ngứa ✓ ủ 15–20p…).
   - **6–8 cặp trước → sau.** Câu "trước" là lỗi điển hình; câu "sau" lấy giọng slide thật:
     - "Sản phẩm giúp dưỡng ẩm hiệu quả và làm sáng da vượt trội" → "Mỗi tối thoa 2–3 giọt, sáng dậy da mướt mát luôn á"
     - "Bạn đã bao giờ thắc mắc cách dùng body oil?" → "Mua body oil mà mí bà đã biết cách xài đúng chưa"
     - "Không chỉ thơm mà còn dưỡng da" → "Mùi phấn ngọt như kẹo, thơm lâu lắmmm"
     - "Trắng x2 chỉ sau 7 ngày" → "Kiên trì 2–3 lần/tuần, da lên tone là có thiệt nha"
     - "Trị viêm nang lông hiệu quả" → "Chải khô + body oil, vùng sần sùi đỡ hơn hẳn"
     - "Thành phần BHA giúp làm sạch sâu, dầu cám gạo giúp dưỡng ẩm" → "Có BHA nên sạch hơn, thông thoáng lcl, mà vẫn mướt"
     - Thêm tối đa 2 cặp cho chữ bìa quá dài và cho caption TikTok.
   - Mỗi cặp ghi một dòng "vì sao", trỏ về dòng tương ứng trong bảng "là / không là".

4. **Tạo hai file cụm cấm**, mỗi dòng một cụm, dòng `#` là chú thích:
   - **`docs/brand/chung/cam.txt`**, câu sáo tiếng Việt cho mọi brand:
     ```text
     bạn đã bao giờ
     hãy cùng khám phá
     khám phá ngay
     không chỉ
     nâng tầm
     đỉnh cao
     vượt trội
     hoàn hảo
     tuyệt vời
     thần thánh
     chất lượng hàng đầu
     giải pháp
     đừng bỏ lỡ
     còn chần chừ
     cam kết 100%
     hiệu quả ngay lập tức
     ```
   - **`docs/brand/moaw/cam.txt`**, dòng đầu ghi `# Mặc định tránh tới khi chốt T-02; chốt cho dùng thì xóa dòng`:
     ```text
     x2 trắng
     trắng cấp tốc
     trắng sau
     trắng như em bé
     trị viêm
     trị thâm
     trị mụn
     điều trị
     hết thâm
     ```
5. **`giong-van.md`: thêm mục "Cấm tuyệt đối" ở cuối file.** Tóm tắt ngắn và trỏ tới hai file `cam.txt` cùng `vi-du.md`. Không chép lại cả danh sách.
6. **`thuong-hieu.md`:** chuyển mọi ô CẦN CHỐT thành bảng "Câu hỏi mở" ở cuối file, cột: câu hỏi | khuyến nghị | ưu tiên | ai chốt. Khuyến nghị:
   - **Tệp khách hàng:** nữ 18–30 mê skincare body, xem TikTok/Threads. Ưu tiên Trung.
   - **Tên bộ chai nhỏ:** hỏi anh, tạm gọi "bộ chai nhỏ". Ưu tiên Thấp.
   - **Túi Radiant White:** coi là bản túi của tuýp tím cho tới khi anh nói khác. Ưu tiên Thấp.
   - **Mức "trắng":** giữ mặc định tránh. Ưu tiên Cao.

## Success Criteria

- [x] Bốn mục mới có mặt. Bảng "là / không là" có 5 dòng.
- [x] `vi-du.md` có 2 bộ mẫu và 6–8 cặp. Mọi câu "sau" tra ngược được về slide đã đăng (ghi tên file slide nếu xác định được) hoặc lời anh.
- [x] Hai file `cam.txt` có đúng định dạng: mỗi dòng một cụm, `#` là chú thích.
- [x] Không còn ô CẦN CHỐT nào thiếu khuyến nghị.

## Risk Assessment

- **Cụm cấm bắt nhầm câu bình thường** (ví dụ "không chỉ"). Phase 2 có test các câu hợp lệ. Bắt nhầm nhiều thì bớt cụm ở đây, không thêm luật ngoại lệ vào code.
- **Ví dụ quá giống nhau làm model rập khuôn.** Giữ đúng số lượng; hai bộ mẫu phải khác dạng.
