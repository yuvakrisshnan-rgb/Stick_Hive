#!/usr/bin/env bash
set -euo pipefail

ENDPOINT="${S3_ENDPOINT:-http://localhost:4566}"
REGION="${AWS_REGION:-ap-south-1}"
BUCKET="${S3_BUCKET_NAME:-stick-hive}"

aws --endpoint-url "$ENDPOINT" --region "$REGION" s3api put-bucket-cors \
  --bucket "$BUCKET" \
  --cors-configuration file://backend/storage/cors.json

printf 'S3 CORS configured for %s at %s\n' "$BUCKET" "$ENDPOINT"
