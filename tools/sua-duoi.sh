#!/usr/bin/env bash
# Chạy trên thư mục tạm chứa các ảnh vừa tải, trước khi chuyển ảnh vào kho.
set -euo pipefail
thu_muc=${1:?Dùng: tools/sua-duoi.sh <thư mục ảnh vừa tải>}
[[ $# -eq 1 && -d $thu_muc ]]
while IFS= read -r -d '' anh; do
  case $(file -b --mime-type -- "$anh") in
    image/jpeg) duoi=jpg ;;
    image/png) duoi=png ;;
    image/heic|image/heif) duoi=heic ;;
    image/webp) duoi=webp ;;
    *) printf 'Không phải JPEG, PNG, HEIC hoặc WebP: %s\n' "$anh" >&2; exit 1 ;;
  esac
  ten=${anh##*/}; dang_co=${ten##*.}; dang_co=${dang_co,,}
  if [[ $ten == *.* && ( $dang_co == "$duoi" || $duoi == jpg && $dang_co == jpeg ) ]]; then continue; fi
  goc=${ten%.*}; dich="$thu_muc/$goc.$duoi"; i=1
  while [[ -e $dich || -L $dich ]]; do
    duoi_trung=-doi
    if (( i > 1 )); then duoi_trung+=-$i; fi
    dich="$thu_muc/$goc$duoi_trung.$duoi"; i=$((i + 1))
  done
  mv -nT -- "$anh" "$dich"
  printf '%s -> %s\n' "$anh" "$dich"
done < <(find "$thu_muc" -maxdepth 1 -type f -print0)
