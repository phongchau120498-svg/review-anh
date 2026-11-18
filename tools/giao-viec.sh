#!/usr/bin/env bash
set -u

# Keep the caller's process group so revoking computer access also kills this job.
result=$(timeout --foreground -k 4 870 unshare --user --map-current-user --pid --fork --mount-proc --kill-child \
  node "$(dirname -- "$0")/giao-viec.mjs" --giao "$@" 2>/dev/null)
status=$?
case "$status" in
  124|137) printf '%s\n' '{"ok":false,"loi":"het-gio"}' ;;
  126|127) printf '%s\n' '{"ok":false,"loi":"Không chạy được Node hoặc timeout"}' ;;
  *)
    if [[ -n $result ]]; then
      printf '%s\n' "$result"
    else
      printf '%s\n' '{"ok":false,"loi":"Không khởi động được cách ly tiến trình"}'
      status=1
    fi
    ;;
esac
exit "$status"
