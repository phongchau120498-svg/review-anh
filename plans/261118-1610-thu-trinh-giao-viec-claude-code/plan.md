---
title: "Thu Trinh giao việc dựng bộ ảnh cho Claude Code trên PC"
description: "Thu Trinh điều phối; Claude Code headless trên PC xem ảnh, chọn, dựng, kiểm; ảnh thành phẩm về chat qua attach_file"
status: in-progress
priority: P2
branch: "main"
tags: [thu-trinh, claude-code, draft]
blockedBy: []
blocks: []
created: "2026-11-18T09:13:14.368Z"
createdBy: "ck:plan"
source: skill
---

# Thu Trinh giao việc dựng bộ ảnh cho Claude Code trên PC

## Overview

Bot không tự xem ảnh được trên máy mượn. Plan này đổi vai trò:

```
Anh ──chat──▶ Thu Trinh (điều phối, bot.onehand.space)
                │ shared_computer run_command: tools/giao-viec.sh <sp>
                ▼
        Claude Code headless trên PC (xem ảnh, chọn, viết bo-anh.json,
        chạy tools/dung-bo-anh.mjs, tự kiểm) → in JSON tóm tắt
                │
Thu Trinh: read_file ảnh kết quả → ghi workspace → attach_file → chat của anh
```

Chỉ bản nháp. Không đăng, không upload, không sửa OpenMausBot hay production.

## Đã xác minh (18/11/2026)

- `attach_file` hiển thị ảnh đầy đủ trong chat: Thu Trinh đã `read_file` → ghi workspace → `attach_file` với `ra/_bang-nguon/body-oil/trang-1.jpg` (628 KB). Anh xem được.
- `run_command`: tối đa 900 giây, output tối đa 256 KB (`OpenMausBot/electron/shared-computer-access.mjs`: `MAX_COMMAND_SECONDS`, `OUTPUT_LIMIT`).
- `read_file`: tối đa 2 MiB, chỉ file thường có **một** link (`READ_LIMIT`, `stat.nlink !== 1n`). Ảnh gốc trong `nguon/<sp>/` là hardlink từ `nguon/_kho/` nên **không gửi trực tiếp được**; ảnh trong `ra/` gửi được.
- Trên máy có `claude` 2.1.327 và `codex` 0.170.0, đã đăng nhập tài khoản anh.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Script giao việc](./phase-01-script-giao-vi-c.md) | Hoàn tất |
| 2 | [Sửa hướng dẫn Thu Trinh](./phase-02-s-a-h-ng-d-n-thu-trinh.md) | Hoàn tất |
| 3 | [Chạy thử Body Oil](./phase-03-ch-y-th-body-oil.md) | Chờ thử gửi ảnh trong chat |

Phase 1 → 2 → 3 tuần tự. Phase 3 cần anh có mặt.

## Tracking

| Phiên | Phạm vi | Trạng thái |
|-------|---------|------------|
| Codex `/root/phase1` | `tools/giao-viec.sh`, `tools/giao-viec.mjs`, `tools/giao-viec.test.mjs` | Hoàn tất, đã nhả file |
| Codex `/root/phase2` | `docs/huong-dan-thu-trinh-may-linux.md` | Hoàn tất, đã nhả file |
| Codex `/root/review` | Diff phase 1–2 | Review độc lập một lượt, đã xử lý 2 High và 1 Medium |
| Codex `/root` | Plan, HANDOFF và kiểm chung | Đã kiểm chung phase 1–2. Anh đã giao commit và push `main` |

- Các phát hiện review đã sửa gồm hủy tiến trình khi dừng lệnh, mô tả thẻ duyệt ở mức Ask và giới hạn độ dài của lệnh. Chi tiết và bằng chứng ở từng phase.
- `npm test` **28/28 đạt** trong 7,73 giây trên diff cuối, gồm fixture OpenMausBot cô lập. `git diff --check`, `bash -n tools/giao-viec.sh`, `node --check tools/giao-viec.mjs` và `node --check tools/giao-viec.test.mjs` đạt. Lượt kiểm ở working tree trên mốc `5e5d844` trước commit.

### Sửa lỗi terminal mượn ngày 19/11

- Hai lượt `run_command` lúc 09:55 báo lỗi cách ly tiến trình. Nhật ký kernel ghi AppArmor từ chối `unshare` đồng thời ở cả hai lượt. OpenMausBot chạy với profile `unconfined`, còn bài thử cũ thừa hưởng profile `chatgpt`. Đã tái hiện lỗi với `aa-exec -p unconfined`.
- Claude Code chạy trong dịch vụ systemd tạm của user. Hủy lời gọi sẽ đóng đường stdin giám sát, kết thúc dịch vụ và toàn bộ tiến trình con. Lệnh dựng/kiểm vẫn chạy trong Bubblewrap không mạng. Dùng user manager đang chạy trên PC, không sửa AppArmor hay OpenMausBot.
- Chạy hàm `sharedCommand` cục bộ của OpenMausBot dưới profile `unconfined` với brief MẪU và ảnh tổng hợp. Run `2026-11-19T03-01-20-642Z-5d9f82fd` trả mã 0 sau 37,619 giây, có bảng xem và 3 JPEG, mỗi file tối đa 2 MiB và một hardlink. `npm test` trong cùng profile đạt 28/28, gồm kiểm hủy tiến trình con. Bản sửa trên working tree của PC, mốc `e4efe25`.

### Review trải nghiệm ngày 19/11

- Anh chốt bỏ giá và link mua hàng khỏi bản review trải nghiệm. Thu Trinh dùng ghi chú trong chat và ảnh nguồn, tùy chọn tham khảo nội dung brief có sẵn. Lệnh giao việc chạy cả khi thư mục sản phẩm chưa có `brief.json`.
- Renderer dùng `--trai-nghiem` ở lệnh nội bộ của draft, kiểm giá và link trong chữ ảnh và caption. Manifest draft không có dữ liệu giá/link, nên không khớp brief dùng với Postiz. Các lệnh cũ và MCP vẫn dùng kiểm brief đầy đủ.
- `npm test` dưới profile `unconfined`: **28/28**, gồm test dựng khi thiếu brief và chặn giá/link trong bản nháp. `git diff --check` và kiểm cú pháp đạt. Claude Code thật qua `sharedCommand` trả bảng xem và 3 JPEG trong **40,382 giây** với thư mục thử `body-oil` chứa ảnh tổng hợp và không có brief. Run `2026-11-19T03-07-36-797Z-55915568`. Thay đổi nằm trên working tree PC, mốc `e4efe25`.

## Tiêu chí nghiệm thu

- Anh nhắn Thu Trinh "làm bộ Body Oil", Thu Trinh tự gọi `tools/giao-viec.sh`, rồi `bang-ket-qua.jpg` và từng ảnh `01.jpg`… hiện trong chat. Anh không phải kéo ảnh hay mở thư mục.
- Claude Code headless không ghi được ngoài `ra/` và `nguon/<sp>/bo-anh.json`, không chạy lệnh ngoài danh sách cho phép, không truy cập mạng ngoài model.
- Một lượt chạy xong trong 900 giây hoặc báo lỗi rõ. Không treo.

## Chặn / chờ anh

- Phase 3 còn lượt yêu cầu Thu Trinh dựng Body Oil và xác nhận bảng xem, từng ảnh, vòng góp ý trong chat.
- Mỗi lượt dùng hạn mức gói Claude của anh. Ảnh sản phẩm được gửi tới Anthropic để xem.

## Dependencies

Thay cho bước 2 và bước 4 ("anh kéo ảnh vào chat") trong [plan gốc](../261117-1437-lam-thu-chuoi-anh-review/plan.md). Không chặn và không bị chặn bởi plan khác.
