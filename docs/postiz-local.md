# Postiz local — chuẩn bị và các bước anh tự bấm

Cập nhật 17/11/2026. Đã chuẩn bị cấu hình, **chưa chạy Postiz, tunnel hay kết nối kênh**. Còn chờ tài khoản Cloudflare/domain, Threads thử và TikTok thử để riêng tư. Chỉ dùng tài khoản thử; chưa có bài đăng hoặc lịch đăng nào.

## Cấu hình đã chuẩn bị

[`postiz/docker-compose.yml`](../postiz/docker-compose.yml) dựa trên [compose chính thức tại commit dd4969e](https://github.com/gitroomhq/postiz-docker-compose/tree/dd4969e5e694cd009619a0d53cff14c21104580b), với Postiz **v2.26.0** và mọi image ghim digest. Giữ Postgres, Redis, Temporal, Postgres của Temporal và Elasticsearch cùng healthcheck/dependency của upstream; bỏ giao diện Temporal, admin-tools và Spotlight tùy chọn. Tất cả dịch vụ dùng `restart: unless-stopped`; chỉ Postiz mở `127.0.0.1:4007`, các dịch vụ dữ liệu không publish port. Dynamic config Temporal chính thức được nhúng bằng Compose `configs.content` (cần Compose 2.23.1+; máy hiện có 2.40.3).

Dữ liệu nằm trong Docker named volumes mang tiền tố `review-anh-postiz_`, không nằm trong Git. Không dùng `docker compose down -v`: tùy chọn `-v` xóa cơ sở dữ liệu. Thư mục `postiz/data/` cũng đã được ignore nếu sau này xuất bản sao lưu.

Máy đã có `~/.local/bin/cloudflared` **2026.11.0** từ [release Cloudflare](https://github.com/cloudflare/cloudflared/releases/tag/2026.11.0); SHA-256 bản Linux amd64: `51f7c68b57ed7269164075d7e789efce5b59355982f06392deeb037d982a51fd`. Chưa tạo hoặc cài tunnel thành dịch vụ.

## 1. Domain và kho ảnh R2 — anh làm

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Onboard a domain** → nhập domain anh sở hữu → chọn gói → rà DNS hiện có. Làm theo [hướng dẫn đổi nameserver tại nhà đăng ký](https://developers.cloudflare.com/learning-paths/clientless-access/initial-setup/add-site/), chờ trạng thái **Active**. Chưa đổi DNS của dịch vụ đang vận hành nếu chưa rà các bản ghi.
2. **R2 Object Storage → Create bucket** → tạo bucket riêng cho bản thử, chọn Automatic/Standard. Việc bật R2 có thể yêu cầu anh thêm phương thức thanh toán; anh tự xác nhận trên Cloudflare.
3. Bucket → **Settings → Custom Domains → Connect Domain** → dùng một subdomain riêng, ví dụ `media.example.com` → chờ domain/TLS Active. Ảnh ở đây phải công khai qua HTTPS để Threads/TikTok tải được; không đặt Access trước domain ảnh. Không dùng link quản trị bucket hoặc endpoint S3 làm URL ảnh. Xem [public bucket/custom domain](https://developers.cloudflare.com/r2/buckets/public-buckets/).
4. **R2 → Manage API Tokens → Create Account API token** → **Object Read & Write → Apply to specific buckets only** → chỉ chọn bucket thử. Lưu Access Key ID/Secret Access Key vào `postiz/.env`; đây là token riêng của R2, không dùng token tunnel. Xem [quyền token R2](https://developers.cloudflare.com/r2/api/tokens/).
5. Bucket → **Settings → CORS policy**: theo [hướng dẫn R2 của Postiz](https://docs.postiz.com/self-host/configuration/r2), dùng đúng origin Postiz HTTPS của anh ở `AllowedOrigins`, không dùng `*`. Các phương thức là `GET`, `POST`, `HEAD`, `PUT`, `DELETE`; các header `Authorization`, `x-amz-date`, `x-amz-content-sha256`, `content-type`; expose `ETag`, `Location`.
6. **Chưa bật quy tắc xóa ảnh.** [R2 lifecycle](https://developers.cloudflare.com/r2/buckets/object-lifecycles/) chỉ lọc tuổi/prefix, không biết bài đã đăng. [Postiz v2.26.0](https://github.com/gitroomhq/postiz-app/blob/v2.26.0/libraries/nestjs-libraries/src/upload/cloudflare.storage.ts) tạo tên ngẫu nhiên ngay ở root bucket, không tách ảnh chưa đăng bằng prefix. Tiêu chí tự xóa riêng ảnh chưa đăng còn chờ chốt cách nhận diện và thời gian lưu; không thay bằng xóa toàn bucket vì có thể mất ảnh bài đang chờ.

## 2. Named tunnel và Access — anh làm

1. Trước khi nối tunnel, **Zero Trust → Access controls → Applications → Add an application → Self-hosted** → hostname ví dụ `postiz.example.com`, Path để trống. Tạo chính sách **Allow**, Include **Emails**, chỉ email của anh; đăng nhập qua mã email hoặc nhà cung cấp anh chọn. Không dùng chính sách Allow Everyone. Xem [Access cho ứng dụng tự host](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/).
2. **Zero Trust → Networks → Connectors → Cloudflare Tunnels → Create a tunnel → Cloudflared** → đặt tên cố định `review-anh-postiz`. Trong mục cài connector Linux, anh chạy lệnh `service install` do dashboard cấp với binary `/home/thanh-phong/.local/bin/cloudflared`. Lệnh có token riêng tư nên không dán vào Git/chat/log. Không tạo Quick Tunnel `trycloudflare.com`. Xem [tạo tunnel từ dashboard](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/create-remote-tunnel/).
3. **Published application routes → Add** → subdomain `postiz`, domain của anh, Service **HTTP**, URL **127.0.0.1:4007**. Cloudflare tạo DNS route cho named tunnel này. Không thêm route đến Postgres/Redis/Temporal/Elasticsearch.
4. Giữ mọi đường dẫn sau ở Access chỉ email anh: `/`, `/api/auth/*`, `/integrations/social/threads`, `/integrations/social/tiktok`. OAuth kết nối kênh đi về trình duyệt đã đăng nhập Access; thử lại trong cùng trình duyệt. Không mở toàn `/api/*` để chữa lỗi callback.
5. Thẻ Postiz có sẵn của MausBot chỉ gửi Bearer key, không có ô cho header service token của Access. Sau khi Postiz chạy, đã kiểm API từ loopback, **đã qua cổng kiểm trước Connect ở mục 6 và anh giao Connect**, mới thử thẻ; nếu bị Access chặn, tạo ứng dụng Access riêng, cụ thể hơn, **Bypass → Include Everyone** cho `postiz.example.com/api/mcp` (thẻ dùng URL không có dấu `/` cuối), cùng `postiz.example.com/api/public/v1/*`. Vì Access có kế thừa đường dẫn, thêm ứng dụng **Allow chỉ email anh** cụ thể hơn tại `/api/mcp/*` để giữ các đường con chứa key trong URL phía sau Access. Chỉ endpoint MCP Bearer và API công khai bỏ lớp Access; Postiz vẫn bắt buộc API key, kiểm không key/sai key phải **401**. Kiểm riêng `/api/mcp/not-a-real-key` vẫn bị Access chặn; không nới `/api/*` hay `/api/mcp*`. Xem [ưu tiên đường dẫn Access](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/) và [Bypass một endpoint](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/common-policies/).

## 3. Điền cấu hình, tạo admin rồi khóa đăng ký

Các lệnh dưới đây là hướng dẫn cho bước chạy sau khi anh đã có tài khoản/domain và giao bật dịch vụ; **chưa được chạy trong phần chuẩn bị**.

Từ thư mục gốc repo:

```bash
git check-ignore -v postiz/.env postiz/data/check
git check-ignore -q postiz/.env.example # phải trả exit 1: mẫu không bị ignore
cp -n postiz/.env.example postiz/.env
chmod 600 postiz/.env
```

Điền bằng trình soạn thảo, không đưa secret vào command line hoặc commit:

| Biến trong `postiz/.env` | Giá trị |
| --- | --- |
| `MAIN_URL` | Origin HTTPS cố định, ví dụ `https://postiz.example.com`, **không** có `/api` và không có dấu `/` cuối |
| `JWT_SECRET` | Chuỗi ngẫu nhiên riêng; có thể sinh bằng `openssl rand -hex 32` |
| `POSTGRES_PASSWORD`, `TEMPORAL_POSTGRES_PASSWORD` | Hai chuỗi hex ngẫu nhiên khác nhau (`openssl rand -hex 24` cho mỗi chuỗi), tránh ký tự cần escape trong database URL |
| `DISABLE_REGISTRATION` | `false` khi tạo admin đầu tiên; đổi `true` ngay sau đó |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID của R2 |
| `CLOUDFLARE_ACCESS_KEY`, `CLOUDFLARE_SECRET_ACCESS_KEY` | Cặp khóa R2 chỉ có quyền bucket thử |
| `CLOUDFLARE_BUCKETNAME` | Tên bucket thử |
| `CLOUDFLARE_BUCKET_URL` | Domain ảnh công khai, ví dụ `https://media.example.com`, không có dấu `/` cuối |
| `THREADS_APP_ID`, `THREADS_APP_SECRET` | Điền sau khi tạo app Threads ở bước 4 |
| `TIKTOK_CLIENT_ID`, `TIKTOK_CLIENT_SECRET` | Điền sau khi tạo app TikTok ở bước 5 |

Compose suy ra `FRONTEND_URL=MAIN_URL` và `NEXT_PUBLIC_BACKEND_URL=MAIN_URL/api`, đặt `BACKEND_INTERNAL_URL=http://localhost:3000`, `STORAGE_PROVIDER=cloudflare`, `CLOUDFLARE_REGION=auto`; đây đều là [biến chính thức của Postiz](https://docs.postiz.com/self-host/configuration/reference). Không cần OpenAI API key, Stripe, OIDC hay dịch vụ AI trả phí.

```bash
docker compose --env-file postiz/.env -f postiz/docker-compose.yml config -q
sudo systemctl enable --now docker
docker compose --env-file postiz/.env -f postiz/docker-compose.yml up -d
docker compose --env-file postiz/.env -f postiz/docker-compose.yml ps
```

Mở HTTPS Postiz qua Access, anh tạo tài khoản đầu tiên bằng email/mật khẩu. Ngay sau đó sửa `DISABLE_REGISTRATION=true` rồi áp dụng lại:

```bash
docker compose --env-file postiz/.env -f postiz/docker-compose.yml up -d postiz
curl -fsS http://127.0.0.1:4007/api/auth/can-register
```

Phải nhận `{"register":false}`; không thử bằng cách tạo tài khoản thứ hai. [Source v2.26.0 `canRegister`](https://github.com/gitroomhq/postiz-app/blob/v2.26.0/apps/backend/src/services/auth/auth.service.ts#L24) cho LOCAL đăng ký khi chưa có tổ chức ngay cả khi đã đặt `true`; sau tổ chức đầu tiên thì chặn. Vẫn giữ trình tự tạo admin rồi khóa ngay theo plan. Không bật generic OAuth/OIDC; source có ngoại lệ cho provider đó.

## 4. App Meta và Threads thử — anh làm

1. [Meta for Developers](https://developers.facebook.com/apps/) → **Create App → Access the Threads API**. Chỉ dùng app/tài khoản thử, chưa chuyển sang tài khoản vận hành.
2. Trong use case Threads, thêm `threads_basic` và `threads_content_publish`. Settings → lưu **Threads App ID** và **Threads App Secret** vào hai biến tương ứng.
3. Đăng ký đúng redirect URI `https://postiz.example.com/integrations/social/threads`. Bấm URL trong form để kích hoạt; làm xong wizard tùy chỉnh app. Nếu Meta bắt nhập Uninstall/Delete callback, [Postiz](https://docs.postiz.com/self-host/providers/threads) ghi có thể nhập cùng URL nhưng Postiz chưa hỗ trợ xử lý hai callback đó; không coi đó là chức năng đã hoạt động.
4. **App roles → Roles → Testers → Add People → Threads Tester** → thêm username tài khoản Threads thử. Trên chính tài khoản Threads thử, **Settings → Account → Website permissions → Invites**, chấp nhận lời mời tester.
5. Áp dụng lại Postiz sau khi điền env; anh đăng nhập Postiz → **Add Channel → Threads** → tự đăng nhập và chấp thuận đúng tài khoản thử. Nếu không thấy Threads, kiểm env app ID/secret đã tải vào backend.

## 5. App TikTok và tài khoản thử riêng tư — anh làm

1. Trong app TikTok, đặt **tài khoản thử** thành **Private account** trước. App chưa qua audit chỉ cho Direct Post riêng tư và yêu cầu chính tài khoản đăng cũng để riêng tư; xem [hướng dẫn TikTok/Postiz](https://docs.postiz.com/self-host/providers/tiktok).
2. [TikTok for Developers](https://developers.tiktok.com/apps) → tạo app Web; điền website, Terms of Service và Privacy Policy HTTPS thật. Thêm **Login Kit** và **Content Posting API → Direct Post**. Redirect URI luôn là `https://postiz.example.com/integrations/social/tiktok`.
3. Yêu cầu scope theo app/Postiz: `user.info.basic`, `user.info.profile`, `video.create`, `video.publish`, `video.upload`; lấy Client ID và Client Secret vào `postiz/.env`. Quyền chưa được cấp phải xử lý trong dashboard, không giả định kết nối sẽ thành công.
4. Trong app, **URL properties** → thêm domain `media.example.com` để xác minh quyền sở hữu dùng cho `PULL_FROM_URL`. Theo [Media Transfer Guide](https://developers.tiktok.com/doc/content-posting-api-media-transfer-guide), nên chọn domain verification bằng bản ghi DNS signature được TikTok cấp. Anh thêm đúng bản ghi đó trong Cloudflare DNS rồi bấm Verify. Domain ảnh HTTPS phải trả ảnh trực tiếp, không redirect/Access, và tồn tại suốt quá trình TikTok tải.
5. Nộp hồ sơ duyệt/audit app TikTok theo dashboard; không có thời hạn duyệt chắc chắn. Sau khi env được áp dụng lại, anh vào **Postiz → Add Channel → TikTok**, tự đăng nhập tài khoản thử riêng tư và chấp thuận.

## 6. API, thẻ Postiz và nghiệm thu sau khi chạy

Docker nginx của [v2.26.0](https://github.com/gitroomhq/postiz-app/blob/v2.26.0/var/docker/nginx.conf) chỉ đưa `/api/` vào backend. Vì vậy dùng các địa chỉ sau, thay `example.com` bằng domain thật:

| Nơi dùng | Địa chỉ |
| --- | --- |
| Giao diện Postiz | `https://postiz.example.com` |
| `POSTIZ_URL` cho công cụ upload `review-anh` | `https://postiz.example.com/api` |
| Upload ảnh | `POSTIZ_URL` + `/public/v1/upload` |
| Liệt kê kênh | `POSTIZ_URL` + `/public/v1/integrations` |
| MCP Bearer | `https://postiz.example.com/api/mcp` |
| **Own server address** trên thẻ Postiz MausBot | `https://postiz.example.com/api` (thẻ tự thêm `/mcp`) |

`POSTIZ_URL` là cấu hình của công cụ upload, **không phải biến Postiz tự đọc**. Public API gửi `Authorization: <api-key>` theo [API docs](https://docs.postiz.com/public-api/introduction); MCP gửi `Authorization: Bearer <api-key>` theo [MCP docs](https://docs.postiz.com/mcp/introduction). Không đặt key vào URL.

**DỪNG trước khi nhập API key thật hoặc bấm Connect.** Hiện chưa có tài khoản nên đây chỉ là hướng dẫn, chưa thao tác. Khi anh giao nối bot thử, phải làm và kiểm xong theo thứ tự:

1. Chọn đúng bot thử được phép; đặt **bot và thread dùng để thử đều ở Ask**, kiểm mức hiệu lực của cả hai. Không để thread giữ Full access dù bot mặc định là Ask.
2. Đặt danh sách `mcpServers` **tường minh cho mọi bot khác**, giữ các server họ cần và loại `postiz`/`review-anh`; không để danh sách vắng mặt vì khi đó bot có thể nhận mọi server đang bật. Chỉ bot thử được chọn có hai server này trong danh sách tường minh.
3. Kiểm lại cấu hình hiệu lực: bot/thread thử đều Ask, mọi bot khác đều có danh sách tường minh không chứa hai server. Phần kiểm thẻ duyệt phải đạt trên bản MausBot cô lập trước khi nối engine thật theo ngoại lệ đã duyệt. Nếu còn bot nhận mọi server hoặc mức hiệu lực chưa là Ask thì dừng tại đây.
4. **Chỉ khi các kiểm tra trên đạt và anh giao Connect**, mới lấy key ở **Postiz → Settings → Developers → Public API**. Trong MausBot dùng **Apps → Social → Postiz → Use an API key instead → Own server address**, nhập base `/api` ở trên, dán key thật rồi bấm **Connect**.

Không dùng Full access và không coi “Gửi thay anh” là cổng chặn MCP. Nút mặc định **Sign in with Postiz** đi đến Postiz Cloud OAuth `/mcp-oauth-dynamic`; để kết nối local trực tiếp, dùng nhánh API key của chính thẻ sẵn có. Không thêm custom MCP server thứ hai; xem [thẻ Postiz đã có của MausBot](../../OpenMausBot/docs/verification/postiz.md).

Các kết quả còn phải ghi vào phase 5 khi đã chạy thật:

- Trình duyệt ẩn danh/curl không cookie vào `/` bị chuyển đến Access; `/api/auth/*` và các OAuth callback vẫn được bảo vệ.
- `/api/public/v1/integrations` không key/sai key trả 401; key đúng liệt kê được kênh thử. MCP không key/sai key trả 401; thẻ sẵn có Connect thành công và liệt kê tool. Khi còn lớp Access, phản hồi có thể là redirect/403 của Access; chỉ nới đúng các path ở bước 2 sau khi đã kiểm Postiz từ loopback.
- Sau tạo admin, `/api/auth/can-register` trả `false`; tạo mới không được phép.
- Bot Ask tải 3 ảnh, đăng TikTok với `content_posting_method: "DIRECT_POST"`, `privacy_level: "SELF_ONLY"`, `autoAddMusic: "yes"`; anh kiểm bài riêng tư có nhạc trên chính app TikTok. Chỉ khi anh giao/duyệt, bot đăng một bài Threads 3 ảnh trên tài khoản thử, anh kiểm trên app. Không lên lịch hoặc đăng trên tài khoản thật.
- Ghi tên tài khoản thử, ID/URL bài thử, ngày hết hạn token mà Postiz/provider hiển thị (không ghi giá trị token), bằng chứng sau restart máy Docker/tunnel tự lên lại, và cách xử lý ảnh chưa đăng đã chốt. Chưa có các bằng chứng này thì phase 5 vẫn **in-progress**.
