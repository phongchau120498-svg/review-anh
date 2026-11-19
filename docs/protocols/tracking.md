# Tracking

Cập nhật 19/11/2026. Trạng thái: **chưa làm / đang làm / đã kiểm chứng / bị chặn**. Chỉ ghi "đã kiểm chứng" khi có bằng chứng đạt điều kiện xong. Lịch sử và lý do ở [Tracelog](tracelog.md). Chi tiết chặng nằm trong plan được dẫn.

| Mã | Mục tiêu | Trạng thái | Phụ trách | Phụ thuộc / trở ngại | Điều kiện xong | Bằng chứng |
|---|---|---|---|---|---|---|
| T-01 | Thu Trinh làm trọn bộ Body Oil từ chat ([plan giao việc](../../plans/261118-1610-thu-trinh-giao-viec-claude-code/plan.md), phase 3) | đang làm | anh + phiên sau | Anh có mặt, PC mở OpenMausBot | Anh nhắn "làm bộ Body Oil", bảng xem và từng ảnh hiện trong chat, anh không phải kéo ảnh | Thử cục bộ qua `sharedCommand` ra 3 JPEG trong 40,4 s (19/11). Lượt từ chat chưa chạy |
| T-02 | Điền ô **CẦN CHỐT** brand Moaw (khách hàng, sản phẩm túi và chai nhỏ, mức "trắng" được nói) | chưa làm, chờ user chốt | anh/sếp | — | `docs/brand/moaw/thuong-hieu.md` không còn ô CẦN CHỐT | — |
| T-03 | `brief.json` có giá và link cho sản phẩm bán hàng | chưa làm, chờ user chốt | anh | Giá và link thật | `list_nguon` đọc được brief của sản phẩm | — |
| T-04 | Tắt entry MCP `review-anh-pc` trên server | chưa làm, chờ user | anh | Phải đăng nhập server | Thu Trinh không còn gọi MCP lỗi | — |
| T-05 | MCP chạy trên máy chủ bot để bot tự xem và dựng ([plan thử chuỗi](../../plans/261117-1437-lam-thu-chuoi-anh-review/plan.md), phase 6) | bị chặn | phiên sau | Xác nhận quyền project `onhand-bot`, image `omb` thiếu công cụ | Bot gọi `view_bang_anh_nguon` và `dung_bo_anh` thành công trên server | Kiểm chỉ đọc Dokploy 18/11 |
| T-06 | Đổi tên sản phẩm Moaw cũ sang tiền tố `moaw-` | chưa làm, chờ user chốt | — | Nên làm trước khi bàn giao | Mọi thư mục, mục lục, tài liệu dùng `moaw-…`; test hẹp đạt | — |
| T-07 | Đăng qua Postiz (Threads, TikTok riêng tư) (plan thử chuỗi, phase 5–6) | bị chặn | — | Tài khoản thử, Cloudflare/domain | Bài thật trên tài khoản thử, kiểm trên app | Cấu hình local đã kiểm 17/11 |
| T-08 | Phân loại khoảng 800 video thô `ACTION SP`, `SHOW/CHẠM DA` | chưa làm | — | — | Cột `san_pham` trong `kho/moaw.tsv` có giá trị cho các video cần dùng | — |
| T-09 | Kiểu chữ trên ảnh theo brand (hộp trắng mờ, chữ có chân như slide Moaw) | chưa làm, chờ user chốt | — | Quyết định thiết kế | Anh duyệt mẫu mới | — |
| T-10 | Bộ brand dùng chung, `/lam-bo-anh`, `dong-bo`, cấu trúc đa brand, bộ protocol | đang làm | phiên 19/11 | Còn thiếu kiểm `dong-bo` trên máy thứ hai | Test hẹp đạt, `dong-bo` chạy trên máy mới, `/lam-bo-anh` ra một bộ thật trong phiên mới | `f71c7ee`: `node --test tools/*.test.mjs mcp/server.test.mjs` 22/22, `dong-bo` 485 có sẵn / 0 lỗi, giả lập máy mới tải 3 ảnh đúng. Hai bộ thật từ phiên Claude Code mới ở T-12 |
| T-11 | Bàn giao repo cho công ty: chuyển sang tổ chức, máy dùng chung | chưa làm, chờ user chốt | anh | T-02, T-06 | Sếp clone, cài, chạy `dong-bo` và `/lam-bo-anh` trên máy sếp | — |
| T-12 | [Tối ưu brand và quy trình](../../plans/261119-1530-toi-uu-brand-va-quy-trinh/plan.md) | đang làm | phiên 19/11, phase 6 giữ tài liệu và gate chung | Ca thực tế còn lỗi bố cục, trung vị số vòng chưa đạt | Bộ brand, soát chữ, soát độc lập, bài học, thêm brand, lọc ảnh và số đo hoạt động. Ba ca Moaw đạt kỳ vọng, trung vị số vòng giảm ≥ 30%, review và gate đạt | Xem chi tiết bên dưới |

## T-12 · Tối ưu brand và quy trình

- **Phase 1** (`73f4a62`). Đối chiếu 66 ảnh slide. Kiểm cấu trúc bằng Node có 5 dòng giọng, 6 tông, 6 câu hỏi mở, 6 cặp trước/sau có nguồn, 2 JSON mẫu và 25 cụm cấm. `renderSet` đạt 4/4 ảnh Body Oil và 3/3 ảnh bột. `git diff --check` đạt.
- **Phase 2** (`c68be36`). `node --test tools/soat-chu.test.mjs tools/giao-viec.test.mjs tools/dung-bo-anh.test.mjs` đạt 15/15. `node tools/soat-chu.mjs nguon/body-oil/bo-anh.json` thoát 0 với `dat: true`, 0 lỗi và 0 cảnh báo.
- **Phase 3** (`96eb5af`). Chạy `claude -p --setting-sources project --strict-mcp-config --output-format stream-json --verbose -- '/lam-bo-anh …'` với Claude Code 2.1.328, OAuth Pro, Opus 5.5 và agent soát Haiku 5.5. Xem [đầu vào và kỳ vọng](../brand/moaw/ca-thu.md).
  - Body Oil `2026-11-19T08-59-59-095Z-a599a5a0`. Máy `dat: true`, 0 lỗi/cảnh báo, 4/4 JPEG. Sau 3 lượt dựng, Haiku chấm chưa đạt vì chữ chạm chai và ảnh chưa minh họa da ẩm hoặc giọt dầu.
  - Bột thảo mộc `2026-11-19T08-59-33-911Z-c072c9d9`. Máy `dat: true`, 0 lỗi/cảnh báo, 4/4 JPEG. Sau 3 lượt dựng, Haiku chấm chưa đạt vì chữ đè bát bột hoặc da và thiếu giải thích vế pha quá lỏng.
  - Love Oil đạt kỳ vọng hỏi lại. Skill đưa hai góc và chờ chọn, không tạo draft, lượt dựng hay bảng xem.
- **Phase 4** (`36360ef`). `node --test tools/ghi-bai-hoc.test.mjs tools/giao-viec.test.mjs` đạt 6/6, có ca 8 tiến trình ghi đồng thời. Thử trên run `2026-11-19T04-40-47-785Z-ac4ff657` ghi đúng hàng `BH-20261119-1`, đã bỏ hàng mô phỏng.
- **Phase 5** (`c2dec24`). Thử `/them-brand thu` trong thư mục tạm bằng gói Pro, tạo đủ sáu file và TSV tám cột. Agent Haiku chỉ đọc chấm chưa đạt và dẫn file Markdown. Log giữ lại thiếu mục cụ thể để đối chiếu. Đã dọn bộ thử. `node --test tools/ghi-bai-hoc.test.mjs` đạt 5/5.
- **Phase 7** (`7002deb`). Dùng dịch vụ systemd của user chạy `node --test tools/loc-anh.test.mjs tools/dung-bo-anh.test.mjs tools/giao-viec.test.mjs tools/soat-chu.test.mjs`, đạt 20/20. `bash -n` ba script thay đổi và `git diff --check` đạt. Body Oil giữ 88/92 ảnh, bốn ảnh loại vì gần trùng đã đối chiếu bằng mắt, không có ảnh bị loại vì mờ hoặc tối. Vẫn cần ba trang. Bằng chứng cục bộ ở `ra/_kiem-phase-7/{doi-chieu-1.jpg,diem.json}`.
- **Phase 6**. Kiểm 116 liên kết nội bộ trong 23 file Markdown (`AGENTS.md`, `docs/**/*.md`, `HANDOFF.md`) và thêm 8 liên kết trong README, 0 liên kết gãy. Chạy `node --check` từng file `tools/*.mjs` (11 file), `bash -n` từng file `tools/*.sh` (5 file), `git diff --check`, `git diff --check 64df2ec..HEAD` và `git diff --check 64df2ec`, đều đạt.
- **Review độc lập.** Đã rà diff từ `64df2ec` đến `7002deb`, gồm skill, luồng headless, renderer, MCP và tải Drive. Chạy `node --test tools/soat-chu.test.mjs tools/ghi-bai-hoc.test.mjs` đạt 11/11 trước khi sửa. Đã xử lý lỗi High bằng cách soát máy caption ở mọi lượt tương tác, gồm cả yêu cầu làm nhanh. Sửa nhận diện giá, ghi số đo lượt lỗi, trả cảnh báo độ dài, tách tên hai chế độ bảng và gom góp ý của agent vào từng vòng sửa. Đã rà lại phần đổi contract, chưa còn lỗi Critical hoặc High. `node --test tools/soat-chu.test.mjs tools/loc-anh.test.mjs` đạt 10/10 khi rà lại. Rủi ro còn lại ghi dưới mục Nợ kỹ thuật.
- **Kiểm hẹp sau sửa review.** Chạy `node --test tools/soat-chu.test.mjs tools/dung-bo-anh.test.mjs tools/giao-viec.test.mjs tools/loc-anh.test.mjs mcp/server.test.mjs` qua dịch vụ systemd của user. Lượt đầu đạt 32/33, ca MCP không quan sát được khóa trong 5 giây. Chạy lại đạt 33/33.
- **Gate chung sau sửa review.** Chạy một lượt `systemd-run --user --quiet --wait --pipe --collect --working-directory "$PWD" --setenv "PATH=$PATH" -- npm test`. Thoát 0, đạt 44/44 (0 bỏ qua), gồm ca khóa MCP. Bubblewrap gọi trực tiếp và qua `aa-exec -p unconfined` gặp lỗi `cap net_admin` trên máy này.

### Chạy lại hai ca có bản dựng sau phase 7

Hai ca Claude Code CLI mặc định đều dừng trước khi dựng vì cần duyệt thao tác Bash và ghi file. Chạy lại mỗi ca trong thư mục tạm, qua dịch vụ systemd của user, bằng `claude -p --setting-sources project --strict-mcp-config --output-format stream-json --verbose --model claude-opus-5-5 --allowedTools … -- '<lệnh /lam-bo-anh>'`. Danh sách quyền giới hạn lệnh tạo bảng, dựng và soát đúng sản phẩm, sửa draft/caption và gọi `Agent(soat-bo-anh)`. Cả hai ca dùng đủ 3 lượt dựng và 2 vòng tự sửa. Agent Haiku 5.5 chỉ được gọi ở lượt cuối. Bằng chứng ở `ra/_kiem-phase-3-sau-phase-7/`.

- **Body Oil** `2026-11-19T09-55-17-099Z-a04a4776`. Kiểm ảnh 4/4 và soát ảnh, caption 0 lỗi. Haiku chấm chưa đạt vì tiêu đề slide 3 đè logo, cảm nhận mùi và độ thấm không có trong ghi chú, câu mở quy kết.
- **Bột thảo mộc** `2026-11-19T09-54-50-534Z-3f7910de`. Kiểm ảnh 4/4 và soát máy sạch. Có ❌/✓, không tự nhận đã dùng. Haiku chấm chưa đạt vì chữ đè hoặc chạm nhãn và ảnh slide 2 chỉ minh họa vế quá đặc.

Kết quả Love Oil ở phase 3 vẫn là bằng chứng cho ca hỏi lại. Yêu cầu làm nhanh, vòng góp ý thật và đường gửi ảnh qua chat Thu Trinh còn chờ kiểm.

### Đo lại ba lượt Body Oil

Dùng `systemd-run --user --quiet --wait --pipe --collect --working-directory "$PWD" --setenv "PATH=$PATH" -- env -u GIAO_VIEC_MODEL tools/giao-viec.sh body-oil 'da bóng mịn sau tắm'` với model mặc định `claude-opus-5-5`. `cmp` xác nhận đã khôi phục draft sau khi đo. Nguồn số liệu là `ra/_do-luong.tsv`.

| run_id | Vòng | Giây | Token vào | Cache ghi | Cache đọc | Token ra |
|---|---:|---:|---:|---:|---:|---:|
| `2026-11-19T09-36-43-969Z-d8bbeab0` | 49 | 169,559 | 62 | 82.097 | 1.065.715 | 11.842 |
| `2026-11-19T09-38-45-897Z-e2ff6d04` | 37 | 119,512 | 42 | 44.207 | 676.028 | 9.081 |
| `2026-11-19T09-39-58-542Z-dc5f9b9b` | 21 | 70,038 | 26 | 20.233 | 292.256 | 5.774 |

Trung vị số vòng tăng từ 32,5 lên 37 (+13,85%), trong khi mục tiêu là ≤ 22,75. Thời gian tăng từ 109 lên 119,512 giây, cache đọc từ khoảng 354.500 lên 676.028 token, đầu ra từ khoảng 7.750 lên 9.081 token. Đường cơ sở thiếu token vào và cache ghi. Cả ba lượt trả `ok: true`, qua kiểm ảnh và chữ/caption, nhưng nhìn bằng mắt vẫn có chỗ chữ chạm chai hoặc tay. Cả ba dùng hết 3 lượt dựng. Log ghi nhận lệnh Bash ghép và lần đọc brief vắng bị từ chối. `num_turns` chỉ cho tổng số vòng, chưa đủ để định lượng phần tăng theo nguyên nhân. **Chưa đạt mục tiêu số vòng và chất lượng.**

## Nợ kỹ thuật

- Đề xuất cách lưu trữ bớt bài học khi bảng `bai-hoc.md` vượt 200 dòng. Lượt viết chỉ đọc 10 dòng gần nhất.
- Hai phiên `/lam-bo-anh` chạy cùng sản phẩm có thể ghi chung `bo-anh.json` trong khi agent soát đang đọc. Luồng headless giữ khóa theo sản phẩm và dùng bản chụp draft.
- Chưa đo ngưỡng 75 giây khi headless chấm kho lớn chưa có cache rồi tạo mọi trang trong một lệnh. Body Oil chỉ có ba trang.
- `read_file` của MausBot từ chối file hardlink, nên bot không gửi được ảnh gốc trong `nguon/`, chỉ gửi được ảnh trong `ra/`.
- Bảng xem 40 ảnh HEIC tốn khoảng 2,5 GB RAM cho magick. Cần tính khi chạy trên máy chủ nhỏ.
- `dong-bo` chỉ tải được nguồn Drive công khai.
