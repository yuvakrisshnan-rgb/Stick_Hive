# Stick Hive storage

Local development uses Floci's S3-compatible endpoint. Production can use real AWS S3 without changing the API contract.

## Local environment

```env
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
S3_BUCKET_NAME=stick-hive
S3_ENDPOINT=http://localhost:4566
```

The current upload route prepares private-object presigned PUT URLs for custom artwork under `custom-art/temp/`.


## Browser custom-sticker flow

The custom-sticker builder requests `POST /api/storage/upload-url`, then performs a browser `PUT` to the returned presigned URL. The cart line keeps the resulting `artworkObjectKey` and `artworkContentType`. Checkout reuses that uploaded object and the order service finalizes it under `custom-art/orders/<orderId>/...`.
