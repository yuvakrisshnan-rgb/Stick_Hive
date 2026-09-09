# Stick Hive — S3 Storage Phase

This phase adds the S3-compatible storage backend without wiring it into the custom-sticker frontend yet.

## Local

```env
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
S3_BUCKET_NAME=stick-hive
S3_ENDPOINT=http://localhost:4566
```

## Endpoints

- `GET /api/storage/health`
- `POST /api/storage/upload-url`

The upload route accepts PNG/JPEG/WebP and limits files to 5 MB. Objects are placed below `custom-art/temp/` and should stay private. The custom-sticker builder now uses the presigned upload flow when the customer adds/updates a design in the cart.

## Next integration

Connect `sticker-builder.tsx` to the upload-url endpoint, upload the exported artwork directly to S3 using the presigned URL, and retain the S3 object key/reference in the cart/order data. This is now implemented.
