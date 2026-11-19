# Blueprint review-anh

Cập nhật 19/11/2026. Thiết kế đã chốt. Lý do chi tiết từng quyết định nằm ở [hướng làm](huong-lam.md) và [Tracelog](protocols/tracelog.md).

## Bài toán

Thương hiệu mỹ phẩm có kho ảnh và video sản phẩm quay sẵn, cần ra đều **bộ ảnh review dọc 9:16** (TikTok dạng ảnh, Threads nhiều ảnh) với chữ tiếng Việt đúng giọng thương hiệu, không bịa giá, link hay công dụng.

## Đối tượng

- **Anh (chủ dự án)** và **sếp/đồng nghiệp** dùng Claude Code trên máy mình qua lệnh `/lam-bo-anh`.
- **Bot MausBot** của từng người, ví dụ Thu Trinh của anh, giao việc dựng xuống PC đã được cho mượn.
- Brand đầu tiên: **Moaw Moaws**. Thiết kế cho phép thêm brand theo [hướng dẫn thêm brand](them-brand-san-pham-nguon.md).

## Mục tiêu và phạm vi

| Trong phạm vi | Ngoài phạm vi (hiện tại) |
|---|---|
| Kho nguồn theo sản phẩm, có mục lục | Tự quay hoặc chỉnh sửa video |
| Chọn ảnh, viết chữ theo bộ brand, dựng và kiểm bản nháp 1080×1920 | Đăng tự động (Postiz đã chuẩn bị nhưng chờ tài khoản và domain) |
| Trình bản nháp kèm caption để người dùng duyệt | Bot tự đăng khi chưa được duyệt từng bài |
| Nhiều brand chung một repo | Một repo riêng cho từng brand |

## Kiến trúc

```text
Người dùng ──▶ Claude Code (/lam-bo-anh)  ─┐
Người dùng ──▶ Bot MausBot ── shared_computer ──▶ tools/giao-viec.sh ──▶ Claude Code headless ─┤
                                                                                              ▼
docs/brand/ (chung + <brand>)  ──đọc──▶  chọn ảnh từ nguon/<sp>/ ──▶ bo-anh.json ──▶ tools/dung-bo-anh.mjs
                                                                                   (mẫu HTML + Playwright)
                                                                                              ▼
                                                              ra/<sp>/<run_id>/: JPEG + manifest + bảng xem
```

- **Não** là agent (Claude Code hoặc bot), không nằm trong repo. **Repo chỉ là tay chân**: công cụ chạy chắc chắn và kiểm được.
- **Nguồn sự thật về brand**: `docs/brand/`. Mọi đường (skill, giao việc, bot) đọc cùng các file này.
- **Kho**: mục lục `kho/<brand>.tsv` vào Git; ảnh thật ở `nguon/` và bản dựng ở `ra/` thì không. Máy mới chạy `tools/drive-kho.sh dong-bo` để tải kho.
- **MCP server** (`mcp/server.mjs`) bọc cùng công cụ cho bot gọi trực tiếp. Hiện chưa dùng được với bot trên máy chủ riêng (xem [Ground Truth](protocols/ground-truth.md)). Hướng lâu dài là chạy MCP trên chính máy chủ bot.

## Ràng buộc

- Chỉ bản nháp khi chưa có lệnh đăng rõ ràng. Bot đăng bài phải ở mức duyệt Ask.
- Giá và link chỉ lấy từ `nguon/<sp>/brief.json` do người dùng xác nhận. Bản review trải nghiệm (`--trai-nghiem`) cấm giá và link.
- Ảnh xuất: 1080×1920, sRGB, không metadata, dưới 20 MB (TikTok) và 8 MB (Threads).
- Mã brand và mã sản phẩm theo quy ước trong [hướng dẫn thêm brand](them-brand-san-pham-nguon.md).

## Điều kiện nghiệm thu chung

1. Từ một yêu cầu bằng lời, ra bộ 3–4 ảnh đạt kiểm chuẩn, chữ đúng giọng brand, kèm lý do chọn ảnh và caption, không có giá/link bịa.
2. Người khác clone repo, cài theo README, chạy `dong-bo` và `/lam-bo-anh` là ra cùng chất lượng, không phụ thuộc máy của anh.
3. Thêm brand mới không phải sửa code.

## Chưa chốt

- Đổi tên sản phẩm Moaw cũ sang tiền tố `moaw-` (T-06).
- Kiểu chữ trên ảnh: giữ chữ trắng viền đen hay theo hộp trắng mờ của slide thương hiệu (T-09).
- Nơi chạy lâu dài: MCP trên máy chủ bot hay máy dùng chung của công ty (T-05, T-11).
