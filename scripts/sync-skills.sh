#!/usr/bin/env bash
set -euo pipefail
REF="${1:-$(cat SUPERPOWERS_REF)}"
tmp="$(mktemp -d)"
git clone --depth 1 --branch "$REF" https://github.com/obra/superpowers "$tmp"
rm -rf skills
cp -R "$tmp/skills" skills
printf '%s\n' "$REF" > SUPERPOWERS_REF
rm -rf "$tmp"
echo "Synced superpowers skills @ $REF"
