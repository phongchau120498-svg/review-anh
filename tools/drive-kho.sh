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

thu_muc_sp() {
  local m
  for m in ${1//+/ }; do
    [[ $m =~ ^[a-z0-9][a-z0-9-]*$ ]] || continue
    if [[ $m == *-chung ]]; then m=_kho/$m; fi
    printf 'nguon/%s\n' "$m"
  done
}

tai_anh_moi() (
  local catalog=$1 kho=$2 sp=$3 dich=$4 id=$5
  local nhom=${dich%/*} ten=${dich##*/} tam anh moi goc duoi i=1 m xung_dot
  mkdir -p "$kho/$nhom" || return 1
  [[ $(realpath -- "$kho/$nhom") == "$PWD/$kho/$nhom" ]] || return 1
  tam=$(mktemp -d "$kho/$nhom/.tai-XXXXXXXX") || return 1
  trap 'rm -rf -- "$tam"' EXIT
  curl -sSLf --retry 3 -o "$tam/$ten" "$(url "$id")" && [[ -s $tam/$ten ]] || return 1
  tools/sua-duoi.sh "$tam" >&2 || return 1
  shopt -s nullglob dotglob
  anh=("$tam/"*)
  [[ ${#anh[@]} == 1 && -f ${anh[0]} ]] || return 1
  ten=${anh[0]##*/}; moi="$nhom/$ten"; goc=${ten%.*}; duoi=${ten##*.}
  while :; do
    xung_dot=0
    if [[ -e $kho/$moi || -L $kho/$moi ]] ||
      DICH_MOI=$moi DRIVE_ID=$id awk -F '\t' '$4 == ENVIRON["DICH_MOI"] && $5 != ENVIRON["DRIVE_ID"] { match_row = 1 } END { exit !match_row }' kho/*.tsv; then
      xung_dot=1
    fi
    while IFS= read -r m; do
      # Trùng tên ở chính thư mục đang tải sẽ được phát hiện qua $kho/$moi.
      if [[ $m != "$kho/$nhom" && ( -e $m/${moi##*/} || -L $m/${moi##*/} ) ]]; then xung_dot=1; fi
    done < <(thu_muc_sp "$sp")
    if (( ! xung_dot )); then break; fi
    local hau_to=-doi
    if (( i > 1 )); then hau_to+=-$i; fi
    moi="$nhom/$goc$hau_to.$duoi"; i=$((i + 1))
  done
  if [[ $moi != "$dich" ]]; then
    local moi_tsv
    moi_tsv=$(mktemp "${catalog}.XXXXXXXX") || return 1
    trap 'rm -rf -- "$tam"; rm -f -- "$moi_tsv"' EXIT
    DICH_CU=$dich DICH_MOI=$moi DRIVE_ID=$id awk 'BEGIN { FS = OFS = "\t" }
      $4 == ENVIRON["DICH_CU"] && $5 == ENVIRON["DRIVE_ID"] { $4 = ENVIRON["DICH_MOI"]; found = 1 }
      { print } END { exit !found }' "$catalog" > "$moi_tsv" &&
      chmod --reference="$catalog" "$moi_tsv" && mv -fT -- "$moi_tsv" "$catalog" || return 1
  fi
  ln -T -- "${anh[0]}" "$kho/$moi" || return 1
  printf '%s\n' "$moi"
)

dong_bo() {
  # Mỗi brand một mục lục kho/<brand>.tsv. Cột: nhom_drive san_pham loai tai_ve drive_id ngay ten_goc dung_lam.
  # san_pham: tên thư mục trong nguon/, nhiều thư mục nối bằng "+"; tên đuôi "-chung" vào nguon/_kho/; tên bắt đầu "_" chỉ tải, không tạo thư mục.
  local kho=nguon/_kho loi=0 tai=0 co=0 muc_luc khoa moi m link
  compgen -G 'kho/*.tsv' > /dev/null || { echo "Thiếu kho/<brand>.tsv" >&2; return 1; }
  [[ ! -L nguon && ! -L $kho ]] || { echo "nguon/ và nguon/_kho/ phải là thư mục thật" >&2; return 1; }
  exec {khoa}<kho
  flock -x "$khoa"
  for muc_luc in kho/*.tsv; do
    # Đổi tab sang \037 vì IFS=tab gộp các cột trống liền nhau (ảnh cuộn không có sản phẩm).
    while IFS=$'\037' read -r _ sp loai dich id _; do
      [[ $loai == anh || $loai == anh-cuon ]] && [[ -n $dich && $sp != _trung-lap ]] || continue
      valid "$id"
      [[ $dich =~ ^[A-Za-z0-9._-]+/[^/]+$ && $dich != *..* ]] || { echo "Bỏ qua đường dẫn lạ: $dich" >&2; continue; }
      if [[ -f $kho/$dich && -s $kho/$dich && ! -L $kho/$dich && $(realpath -- "$kho/$dich") == "$PWD/$kho/$dich" ]]; then co=$((co + 1))
      elif moi=$(tai_anh_moi "$muc_luc" "$kho" "$sp" "$dich" "$id"); then dich=$moi; tai=$((tai + 1))
      else echo "Lỗi tải $id ($dich)" >&2; loi=$((loi + 1)); continue; fi
      # Thư mục sản phẩm là hardlink từ _kho/, không tốn thêm dung lượng.
      while IFS= read -r m; do
        link="$m/${dich##*/}"
        if ! mkdir -p "$m" || [[ $(realpath -- "$m") != "$PWD/$m" ]] ||
          { [[ -L $link ]] || { [[ ! $link -ef $kho/$dich ]] && ! ln -T -- "$kho/$dich" "$link"; }; }; then
          echo "Không tạo hardlink, giữ nguyên nguồn: $link" >&2; loi=$((loi + 1))
        fi
      done < <(thu_muc_sp "$sp")
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
