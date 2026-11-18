#!/usr/bin/env bash
# Lấy tư liệu từ kho Google Drive (file để chế độ "ai có link cũng xem") theo drive_id trong nguon/_kho/muc-luc.tsv.
#   tools/drive-kho.sh tai   <thu-muc-dich> <drive_id> <ten-file>   tải nguyên file
#   tools/drive-kho.sh khung <thu-muc-dich> <drive_id>              lấy 2 khung (25% và 60%) qua HTTP Range, không tải nguyên video
# Đích phải nằm trong nguon/ (bị Git ignore). Ảnh tải về giữ EXIF/GPS gốc; renderer bỏ metadata khi xuất.
set -euo pipefail
cmd=${1:-}; dest=${2:-}; id=${3:-}
[[ $id =~ ^[A-Za-z0-9_-]{20,80}$ ]] || { echo "drive_id không hợp lệ" >&2; exit 2; }
mkdir -p "$dest"
url="https://drive.usercontent.google.com/download?id=$id&export=download&confirm=t"
case $cmd in
  tai)
    name=${4:?thiếu tên file}; name=${name##*/}
    curl -sSLf --retry 3 -o "$dest/$name.part" "$url" && mv "$dest/$name.part" "$dest/$name" ;;
  khung)
    dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$url")
    for p in a:0.25 b:0.6; do
      ffmpeg -v error -ss "$(echo "$dur * ${p#*:}" | bc)" -i "$url" -frames:v 1 -vf scale=720:-2 -y "$dest/$id-${p%%:*}.jpg"
    done ;;
  *) sed -n 2,5p "$0" >&2; exit 2 ;;
esac
