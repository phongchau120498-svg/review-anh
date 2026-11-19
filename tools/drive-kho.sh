#!/usr/bin/env bash
# Lấy tư liệu từ kho Google Drive (file để chế độ "ai có link cũng xem") theo drive_id trong mục lục kho/<brand>.tsv.
#   tools/drive-kho.sh dong-bo                                      máy mới: tải mọi ảnh trong mục lục về nguon/_kho/ và dựng lại thư mục sản phẩm
#   tools/drive-kho.sh tai   <thu-muc-dich> <drive_id> <ten-file>   tải nguyên file
#   tools/drive-kho.sh khung <thu-muc-dich> <drive_id>              lấy 2 khung (25% và 60%) qua HTTP Range, không tải nguyên video
# Đích phải nằm trong nguon/ (bị Git ignore). Ảnh tải về giữ EXIF/GPS gốc; renderer bỏ metadata khi xuất.
set -euo pipefail
cd "$(dirname "$0")/.."
url() { echo "https://drive.usercontent.google.com/download?id=$1&export=download&confirm=t"; }
valid() { [[ $1 =~ ^[A-Za-z0-9_-]{20,80}$ ]] || { echo "drive_id không hợp lệ" >&2; exit 2; }; }

dong_bo() {
  # Mỗi brand một mục lục kho/<brand>.tsv. Cột: nhom_drive san_pham loai tai_ve drive_id ngay ten_goc dung_lam.
  # san_pham: tên thư mục trong nguon/, nhiều thư mục nối bằng "+"; tên đuôi "-chung" vào nguon/_kho/; tên bắt đầu "_" chỉ tải, không tạo thư mục.
  local kho=nguon/_kho loi=0 tai=0 co=0 muc_luc
  compgen -G 'kho/*.tsv' > /dev/null || { echo "Thiếu kho/<brand>.tsv" >&2; return 1; }
  for muc_luc in kho/*.tsv; do
    # Đổi tab sang \037 vì IFS=tab gộp các cột trống liền nhau (ảnh cuộn không có sản phẩm).
    while IFS=$'\037' read -r _ sp loai dich id _; do
      [[ $loai == anh || $loai == anh-cuon ]] && [[ -n $dich && $sp != _trung-lap ]] || continue
      valid "$id"
      [[ $dich =~ ^[A-Za-z0-9._-]+/[^/]+$ && $dich != *..* ]] || { echo "Bỏ qua đường dẫn lạ: $dich" >&2; continue; }
      if [[ -s $kho/$dich ]]; then co=$((co + 1))
      else
        mkdir -p "$kho/${dich%/*}"
        if curl -sSLf --retry 3 -o "$kho/$dich.part" "$(url "$id")"; then mv "$kho/$dich.part" "$kho/$dich"; tai=$((tai + 1))
        else rm -f "$kho/$dich.part"; echo "Lỗi tải $id ($dich)" >&2; loi=$((loi + 1)); continue; fi
      fi
      # Thư mục sản phẩm là hardlink từ _kho/, không tốn thêm dung lượng.
      local m
      for m in ${sp//+/ }; do
        [[ $m =~ ^[a-z0-9][a-z0-9-]*$ ]] || continue
        [[ $m == *-chung ]] && m=_kho/$m
        mkdir -p "nguon/$m"; ln -f "$kho/$dich" "nguon/$m/${dich##*/}"
      done
    done < <(tail -n +2 "$muc_luc" | tr '\t' '\037')
  done
  echo "Đã có $co, vừa tải $tai, lỗi $loi."
  [[ $loi -eq 0 ]]
}

cmd=${1:-}
case $cmd in
  dong-bo) dong_bo ;;
  tai|khung)
    dest=${2:-}; id=${3:-}; valid "$id"; mkdir -p "$dest"
    if [[ $cmd == tai ]]; then
      name=${4:?thiếu tên file}; name=${name##*/}
      curl -sSLf --retry 3 -o "$dest/$name.part" "$(url "$id")" && mv "$dest/$name.part" "$dest/$name"
    else
      dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$(url "$id")")
      for p in a:0.25 b:0.6; do
        ffmpeg -v error -ss "$(echo "$dur * ${p#*:}" | bc)" -i "$(url "$id")" -frames:v 1 -vf scale=720:-2 -y "$dest/$id-${p%%:*}.jpg"
      done
    fi ;;
  *) sed -n 2,6p "$0" >&2; exit 2 ;;
esac
