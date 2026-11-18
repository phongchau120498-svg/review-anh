#!/usr/bin/env bash
# Bảng xem ảnh nguồn của một sản phẩm, 40 ảnh mỗi trang, dưới mỗi ảnh là tên file đầy đủ (kể cả đuôi).
#   tools/bang-nguon.sh <san-pham> [trang]   -> in đường dẫn bảng và tổng số trang
# Bảng nằm ở ra/_bang-nguon/<san-pham>/, không lẫn vào thư mục nguồn. Cùng kiểu bảng với tool MCP view_bang_anh_nguon.
set -euo pipefail
cd "$(dirname "$0")/.."
sp=${1:?thiếu tên thư mục sản phẩm}; trang=${2:-1}
[[ $sp =~ ^[a-z0-9-]+$ && $trang =~ ^[1-9][0-9]*$ ]] || { echo "Dùng: tools/bang-nguon.sh <san-pham> [trang]" >&2; exit 2; }
[ -d "nguon/$sp" ] || { echo "Không có nguon/$sp" >&2; exit 1; }
mapfile -t anh < <(find "nguon/$sp" -maxdepth 1 -type f -iregex '.*\.\(jpe?g\|png\|heic\|webp\)' -printf '%f\n' | sort)
tong=${#anh[@]}; so_trang=$(( (tong + 39) / 40 ))
(( tong )) || { echo "nguon/$sp không có ảnh" >&2; exit 1; }
(( trang <= so_trang )) || { echo "Trang $trang không có ảnh; có $so_trang trang" >&2; exit 1; }
args=()
for f in "${anh[@]:$(( (trang - 1) * 40 )):40}"; do
  e=$(tr A-Z a-z <<< "${f##*.}"); [ "$e" = jpg ] && e=jpeg   # ép decoder theo đuôi như renderer
  args+=("$e:nguon/$sp/$f")
done
ra="ra/_bang-nguon/$sp"; mkdir -p "$ra"
magick montage -- "${args[@]}" -auto-orient -font fonts/BeVietnamPro-Regular.ttf -set label '%f' -pointsize 16 \
  -geometry 200x356+6+6 -tile 6x -background '#eee8df' -strip -quality 80 "$ra/trang-$trang.jpg"
echo "$PWD/$ra/trang-$trang.jpg (trang $trang/$so_trang, $tong ảnh)"
