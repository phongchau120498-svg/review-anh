#!/usr/bin/env bash
# Bảng xem ảnh nguồn của một sản phẩm, 40 ảnh mỗi trang, dưới mỗi ảnh là tên file đầy đủ (kể cả đuôi).
#   tools/bang-nguon.sh <san-pham> [trang|--tat-ca|--uu-tien]   -> in đường dẫn từng trang
# Mặc định lọc ảnh mờ, tối hoặc gần trùng. --tat-ca tạo mọi trang từ toàn bộ ảnh nguồn.
# Bảng nằm ở ra/_bang-nguon/<san-pham>/, không lẫn vào thư mục nguồn. Cùng kiểu bảng với tool MCP view_bang_anh_nguon.
set -euo pipefail
cd "$(dirname "$0")/.."
sp=${1:-}; mode=${2:-}
[[ $# -le 2 && $sp =~ ^[a-z0-9-]+$ && ( -z $mode || $mode == --tat-ca || $mode == --uu-tien || $mode =~ ^[1-9][0-9]{0,5}$ ) ]] || {
  echo "Dùng: tools/bang-nguon.sh <san-pham> [trang|--tat-ca|--uu-tien]" >&2; exit 2;
}
[ -d "nguon/$sp" ] || { echo "Không có nguon/$sp" >&2; exit 1; }
uu_tien="kho/$sp-uu-tien.txt"
if [[ $mode == --uu-tien && ! -f $uu_tien ]]; then
  echo "Chưa có bảng ưu tiên cho $sp; gọi lại với cú pháp tools/bang-nguon.sh $sp" >&2; exit 1
fi
ra="ra/_bang-nguon/$sp"; mkdir -p "$ra"
tam=$(mktemp -d "$ra/.bang-XXXXXXXX")
trap 'rm -rf -- "$tam"' EXIT
opts=(); tien_to=trang
if [[ $mode == --tat-ca ]]; then
  opts+=(--tat-ca)
  tien_to=trang-tat-ca
fi
node tools/loc-anh.mjs "$sp" "${opts[@]}" --nul > "$tam/anh"
mapfile -d '' -t anh < "$tam/anh"
if [[ $mode == --uu-tien ]]; then
  tien_to=trang-uu-tien
  chon=()
  while IFS= read -r ten; do
    for f in "${anh[@]}"; do
      if [[ $f == "$ten" ]]; then chon+=("$f"); break; fi
    done
    if (( ${#chon[@]} >= 16 )); then break; fi
  done < "$uu_tien"
  anh=("${chon[@]}")
fi
tong=${#anh[@]}; so_trang=$(( (tong + 39) / 40 ))
(( tong )) || { echo "Không có ảnh để lên bảng; thử --tat-ca để xem toàn bộ nguồn" >&2; exit 1; }
dau=1; cuoi=$so_trang
if [[ $mode =~ ^[1-9][0-9]*$ ]]; then
  (( mode <= so_trang )) || { echo "Trang $mode không có ảnh; có $so_trang trang" >&2; exit 1; }
  dau=$mode; cuoi=$mode
fi
for ((trang=dau; trang<=cuoi; trang++)); do
  ten="$tien_to-$trang.jpg"
  args=()
  for f in "${anh[@]:$(( (trang - 1) * 40 )):40}"; do
    e=${f##*.}; e=${e,,}
    if [[ $e == jpg ]]; then e=jpeg; fi
    args+=("$e:nguon/$sp/$f")
  done
  # Các hộp chữ trong mau/chung.css quy đổi từ 1080x1920 sang 198x352. Vàng đứt là bìa, xanh liền là chi tiết.
  magick -limit thread 2 -- "${args[@]}" -auto-orient -resize '198x352^' \
    -gravity center -extent 198x352 +repage -gravity northwest -set label '%f' \
    -fill none -stroke '#49e9ff' -strokewidth 2 -draw 'rectangle 13,58 161,101 rectangle 13,204 161,251' \
    -stroke '#ffe066' -draw 'stroke-dasharray 5,4 rectangle 13,97 161,152 rectangle 13,157 161,203' \
    -strip miff:- | magick montage -font fonts/BeVietnamPro-Regular.ttf -pointsize 14 miff:- \
    -geometry 198x352+6+6 -tile 6x -background '#eee8df' -strip -quality 82 "$tam/$ten"
  mv -fT -- "$tam/$ten" "$ra/$ten"
  echo "$PWD/$ra/$ten (trang $trang/$so_trang, $tong ảnh)"
done
