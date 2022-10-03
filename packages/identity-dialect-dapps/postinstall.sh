set -x

if [ ! -f "src/version.ts" ]; then
  yarn generate-version
fi
