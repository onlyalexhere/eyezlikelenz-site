#!/bin/sh
set -eu

cd "$(dirname "$0")/.."
mkdir -p portfolio/images/story

for number in 01 02 03 06 07 08 13 14 16 18 19 20 28 29 30 31 47 48 49 50 51 52; do
  sips -Z 1600 -s format jpeg -s formatOptions 78 \
    "portfolio/images/large/photo-${number}.jpg" \
    --out "portfolio/images/story/photo-${number}.jpg" >/dev/null
done

echo "Built 22 story images at a maximum 1600px edge."
