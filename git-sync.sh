#!/bin/bash
set -e

echo "==> git stash"
if git diff --quiet && git diff --cached --quiet; then
  echo "    工作区干净，跳过 stash"
  STASHED=false
else
  git stash push -m "auto-stash before sync $(date +%Y%m%d-%H%M%S)"
  STASHED=true
fi

echo "==> git pull --rebase"
git pull --rebase

if $STASHED; then
  echo "==> git stash pop"
  if ! git stash pop; then
    echo "⚠  stash pop 冲突！请手动解决后 git stash drop"
    exit 1
  fi
fi

echo "==> git push"
git push

echo "✔ 同步完成"
