# Ví dụ Moaw Moaws

Hai mẫu `bo-anh.json` dùng trích đoạn nguyên văn từ carousel trong `nguon/_kho/anh-cuon/`. Trường `nguon` trỏ tới ảnh sạch trong thư mục sản phẩm để dựng mẫu. Khi viết bài mới, áp dụng các giới hạn trong [Giọng văn Moaw](giong-van.md) và chỉ kể trải nghiệm có ghi chú của người dùng.

## Bộ A · Cách dùng Body Oil

Nguồn chữ theo thứ tự slide là `IMG_5330.jpg`, `IMG_5333.jpg`, `IMG_5332.jpg` và `IMG_5331.jpg`.

```json
{
  "san_pham": "body-oil",
  "anh": [
    {
      "mau": "bia",
      "nguon": "nguon/body-oil/IMG_7959.jpg",
      "tieu_de": "Mua body oil mà mí bà\nđã biết cách xài đúng chưa"
    },
    {
      "mau": "chi-tiet",
      "nguon": "nguon/body-oil/IMG_5898.HEIC",
      "tieu_de": "1 DÙNG SAU KHI TẮM",
      "y": ["Sau khi tắm lau khô người,", "dùng oil liền vì lúc này da còn hơi ẩm", "da mướt mát,căng bóng."]
    },
    {
      "mau": "chi-tiet",
      "nguon": "nguon/body-oil/IMG_8008.jpg",
      "tieu_de": "2 THOA OIL THEO VÙNG",
      "y": ["Ở cánh tay dùng 2-3 giọt", "còn chân dùng 3-4 giọt oil", "thấm nhanh & tiết kiệm"]
    },
    {
      "mau": "chi-tiet",
      "nguon": "nguon/body-oil/IMG_3727.jpg",
      "tieu_de": "3 KẾT HỢP OIL & LOTION",
      "y": ["Dùng oil trước", "sau 5-10p dùng lotion"]
    }
  ]
}
```

## Bộ B · Nên & không nên khi ủ bột

Nguồn chữ theo thứ tự slide là `IMG_5226.jpg`, `IMG_5227.jpg` và `IMG_5229.jpg`.

```json
{
  "san_pham": "bot-thao-moc",
  "anh": [
    {
      "mau": "bia",
      "nguon": "nguon/bot-thao-moc/IMG_9828.heic",
      "tieu_de": "Nên & không nên",
      "phu": "khi ủ bột"
    },
    {
      "mau": "chi-tiet",
      "nguon": "nguon/bot-thao-moc/IMG_9831.heic",
      "tieu_de": "❌ Pha bột quá lỏng/quá đặc",
      "y": ["✓ Pha sệt sệt", "Quá đặc da bị khô & ngứa"]
    },
    {
      "mau": "chi-tiet",
      "nguon": "nguon/bot-thao-moc/IMG_7783.jpg",
      "tieu_de": "❌ Ủ quá lâu => khô,ngứa da",
      "y": ["✓ Ủ body 15-20p, thấy bột hơi sệt lại", "=> rắc tí nước tạo ẩm, xoa nhẹ", "tránh để bột khô kéo căng da"]
    }
  ]
}
```

## Sáu cặp trước và sau

Các câu trước minh họa lỗi trong [Phase 1](../../../plans/261119-1530-toi-uu-brand-va-quy-trinh/phase-01-giong-van-moaw.md). Các câu sau trích từ slide ghi cạnh câu. Tên dòng trong cột cuối trỏ đến [bảng Moaw là / Moaw không là](giong-van.md#moaw-là--moaw-không-là).

| Trước | Sau | Vì sao |
|---|---|---|
| Sản phẩm giúp dưỡng ẩm hiệu quả và làm sáng da vượt trội | Thoa oil 2-3 giọt mỗi vùng là đủ (`IMG_2145.jpg`) | **Cụ thể.** Cho người đọc số giọt để làm theo. |
| Bạn đã bao giờ thắc mắc cách dùng body oil? | Mua body oil mà mí bà đã biết cách xài đúng chưa (`IMG_5330.jpg`) | **Thân như bạn thân chỉ mẹo.** Gọi "mí bà" và hỏi thẳng về cách dùng. |
| Không chỉ thơm mà còn dưỡng da | Mùi phấn ngọt, giống mùi kẹo. (`quality_restoration_20260124163419813.jpeg`) | **Nói cảm nhận thấy được.** Dùng mùi kẹo để người đọc hình dung. |
| Trắng x2 chỉ sau 7 ngày | Ủ kiên trì đều đặn 2-3 lần/tuần (`IMG_5233.jpg`) | **Tự tin về sản phẩm của mình.** Nêu tần suất dùng, bỏ lời hứa lên tông. |
| Trị viêm nang lông hiệu quả | chải khô + body oil, chải vùng khô ráp sần sùi (`IMG_7797.jpg`) | **Tự tin về sản phẩm của mình.** Chỉ cách chăm vùng da sần, bỏ lời hứa điều trị. |
| Thành phần BHA giúp làm sạch sâu, dầu cám gạo giúp dưỡng ẩm | Chất oil mỏng nhẹ không bết dính (`IMG_2145.jpg`) | **Nói cảm nhận thấy được.** Nêu chất dầu và độ bết bằng lời dễ hình dung. |
