---
title: "Tối ưu bộ brand và quy trình làm bộ ảnh"
description: "Bổ sung giọng văn theo mẫu Anthropic/ECC, kiểm máy chữ, soát độc lập, vòng học từ duyệt, skill thêm brand"
status: pending
priority: P2
branch: "main"
tags: [brand, content, agent]
blockedBy: []
blocks: []
created: "2026-11-19T08:17:52.795Z"
createdBy: "ck:plan"
source: skill
---

# Tối ưu bộ brand và quy trình làm bộ ảnh

## Overview

Bộ brand (`docs/brand/`) và skill `/lam-bo-anh` đã có khung đúng, nhưng còn thiếu những thứ mà các bộ giọng văn lớn đều có. Plan này bổ sung theo bốn nguồn đã khảo sát ngày 19/11:

- **Anthropic `knowledge-work-plugins`, plugin `brand-voice`** (36,5 nghìn sao):
  - bảng "Chúng tôi là / không là";
  - giọng cố định, tông đổi theo ngữ cảnh;
  - ví dụ trước/sau;
  - agent soát riêng chỉ đọc;
  - câu hỏi mở kèm khuyến nghị và mức ưu tiên.

  Nguồn: https://github.com/anthropics/knowledge-work-plugins/tree/main/partner-built/brand-voice
- **ECC `brand-voice`** (306 nghìn sao): danh sách câu sáo cấm tuyệt đối. Nguồn: https://github.com/affaan-m/ecc
- **viraloop, slidelot**: ghi lại kết quả duyệt để học. Xem `docs/tham-khao-mau-thiet-ke.md`.
- **agentbook** (sách *AI Agent*, các chủ đề context-engineering, agent-evolution, eval-dataset-design):
  - 2–3 ví dụ cố định, phủ trường hợp biên, tốt hơn 10 ví dụ giống nhau;
  - luật kiểm được bằng máy thì viết thành code;
  - lưu phản hồi chưa phải là học: phải đánh giá, có bằng chứng, rồi đề xuất sửa nhỏ và chờ duyệt;
  - người soát độc lập với người viết.

## Điều kiện trước khi bắt đầu

- Working tree sạch. Bộ protocol, `docs/brand/`, `/lam-bo-anh` và `dong-bo` (làm ngày 19/11) phải được **commit trước**.
- Đọc `AGENTS.md`, `docs/BLUEPRINT.md`, `docs/them-brand-san-pham-nguon.md`, `docs/brand/**`, `.claude/skills/lam-bo-anh/SKILL.md`, `tools/giao-viec.mjs`.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Nâng cấp giọng văn Moaw](./phase-01-giong-van-moaw.md) | Pending |
| 2 | [Kiểm máy chữ và caption](./phase-02-kiem-may-chu-caption.md) | Pending |
| 3 | [Soát độc lập và ca thử](./phase-03-soat-doc-lap-ca-thu.md) | Pending |
| 4 | [Vòng học từ duyệt](./phase-04-vong-hoc-tu-duyet.md) | Pending |
| 5 | [Skill thêm brand](./phase-05-skill-them-brand.md) | Pending |
| 6 | [Tài liệu và kiểm chung](./phase-06-tai-lieu-kiem-chung.md) | Pending |
| 7 | [Giảm vòng gọi và đo lường](./phase-07-giam-vong-goi-do-luong.md) | Pending |

## Thứ tự và phụ thuộc

- Phase 1 trước, vì phase 2 cần nội dung `cam.txt`.
- Phase 2 tạo `tools/brand.mjs`, mà phase 3 và 4 dùng.
- Phase 3 và 4 chạy song song được: phase 3 sửa `.claude/agents/` và `ca-thu.md`, phase 4 sửa `tools/ghi-bai-hoc.*` và `bai-hoc.md`. Cả hai đều sửa `.claude/skills/lam-bo-anh/SKILL.md`, nên **phase 4 sửa skill sau phase 3**.
- Phase 5 cần phase 1 (khung file brand) và phase 4 (`bai-hoc.md`).
- Phase 7 cần phase 2 (`soat-chu`) và phase 4 (bài học để ghép vào prompt); sửa `.claude/skills/lam-bo-anh/SKILL.md` và `tools/giao-viec.mjs` **sau** phase 3 và 4.
- **Thứ tự chạy:** 1 → 2 → 3 và 4 → 5 → **7 → 6**. Phase 6 (tài liệu và kiểm chung) luôn chạy cuối, dù mang số 6.

## Ngoài phạm vi

- Không đổi tên sản phẩm Moaw sang `moaw-` (T-06) và không đổi mẫu thiết kế ảnh trong `mau/` (T-09).
- Không đăng bài, không chạm Postiz hay MCP trên server.
- Không sửa OpenMausBot hay production.
- Không thêm phụ thuộc npm mới.

## Tiêu chí nghiệm thu cả plan

- [ ] Giọng văn Moaw có bảng "Moaw là / Moaw không là", bảng tông theo chỗ đặt chữ, file ví dụ (2–3 bộ mẫu và 6–8 cặp trước/sau), danh sách cụm cấm. Mọi câu ví dụ có nguồn (slide đã đăng hoặc lời anh).
- [ ] `node tools/soat-chu.mjs nguon/<sp>/bo-anh.json` báo **lỗi** khi:
  - có cụm cấm, kể cả khi viết chèn dấu chấm kiểu `viê.m`;
  - có giá hoặc link trong bản trải nghiệm.

  Nó báo **cảnh báo** khi chữ dài quá ngưỡng. `giao-viec` chặn caption có cụm cấm. Tất cả có test.
- [ ] `/lam-bo-anh` gọi agent soát độc lập (chỉ đọc) trước khi trình. Agent soát trả kết luận có bằng chứng. Bộ trả về tối đa 2 vòng sửa.
- [ ] `node tools/ghi-bai-hoc.mjs` ghi được một dòng có kiểm hợp lệ vào `docs/brand/<brand>/bai-hoc.md`. `/lam-bo-anh` và `giao-viec` đọc bài học trước khi viết. Đề xuất sửa brand cần người dùng duyệt.
- [ ] `/them-brand` dẫn đủ quy trình thêm brand và tạo đủ bộ file brand.
- [ ] 3 ca thử Moaw chạy qua `/lam-bo-anh`: `soat-chu` đạt, agent soát đạt, kết quả ghi trong Tracking.
- [ ] Lượt `giao-viec` trả `do_luong` và ghi `ra/_do-luong.tsv`. Sau 3 lượt đo lại, trung vị số vòng giảm ≥ 30% so với đường cơ sở 32,5 vòng (phase 7), chất lượng vẫn đạt.
- [ ] `npm test` đạt toàn bộ. Có một lượt review độc lập cuối plan. Tài liệu và protocol khớp với code.

## Câu hỏi mở (có khuyến nghị)

| # | Câu hỏi | Khuyến nghị | Ưu tiên |
|---|---|---|---|
| 1 | Agent soát dùng model nào? | `haiku` cho rẻ, theo mẫu Anthropic. Nếu ca thử cho thấy soát sót giọng tiếng Việt thì đổi sang `sonnet` (sửa một dòng frontmatter) | Trung |
| 2 | Bước soát độc lập bật mặc định hay tùy chọn? | Bật mặc định. Người dùng nói "nhanh" thì bỏ qua bước này, nhưng `soat-chu` vẫn chạy | Trung |
| 3 | Cảnh báo độ dài có chặn dựng không? | Không. Chỉ cảnh báo; lỗi tràn chữ đã có renderer chặn | Thấp |
| 4 | Cụm "mặc định tránh" của Moaw (x2 trắng, trị viêm…) có chặn cứng không? | Có, trong `docs/brand/moaw/cam.txt`, tới khi anh chốt T-02. Chốt cho dùng thì xóa dòng tương ứng | Cao |
| 5 | Có cho `giao-viec` chạy model khác (ví dụ Sonnet) để rẻ hơn không? | Phase 7 chỉ thêm tùy chọn `GIAO_VIEC_MODEL`, **mặc định giữ model hiện tại**. Anh quyết sau khi so 3 ca thử trên hai model | Trung |
