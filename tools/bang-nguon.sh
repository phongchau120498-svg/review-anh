#!/usr/bin/env bash
# Bảng xem ảnh nguồn của một sản phẩm, 40 ảnh mỗi trang, dưới mỗi ảnh là tên file đầy đủ (kể cả đuôi).
#   tools/bang-nguon.sh <san-pham> [trang|--tat-ca]   -> in đường dẫn từng trang
# Mặc định lọc ảnh mờ, tối hoặc gần trùng. --tat-ca tạo mọi trang từ toàn bộ ảnh nguồn.
# Bảng nằm ở ra/_bang-nguon/<san-pham>/, không lẫn vào thư mục nguồn. Cùng kiểu bảng với tool MCP view_bang_anh_nguon.
set -euo pipefail
cd "$(dirname "$0")/.."
sp=${1:-}; mode=${2:-}
[[ $# -le 2 && $sp =~ ^[a-z0-9-]+$ && ( -z $mode || $mode == --tat-ca || $mode =~ ^[1-9][0-9]{0,5}$ ) ]] || {
  echo "Dùng: tools/bang-nguon.sh <san-pham> [trang|--tat-ca]" >&2; exit 2;
}
[ -d "nguon/$sp" ] || { echo "Không có nguon/$sp" >&2; exit 1; }
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
  magick montage -- "${args[@]}" -auto-orient -font fonts/BeVietnamPro-Regular.ttf -set label '%f' -pointsize 16 \
    -geometry 200x356+6+6 -tile 6x -background '#eee8df' -strip -quality 80 "$tam/$ten"
  mv -fT -- "$tam/$ten" "$ra/$ten"
  echo "$PWD/$ra/$ten (trang $trang/$so_trang, $tong ảnh)"
done
