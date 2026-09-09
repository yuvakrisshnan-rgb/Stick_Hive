export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Stick Hive API",
    version: "0.1.0",
    description: "Authentication API for the Stick Hive Next.js application.",
  },
  servers: [{ url: "/", description: "Current application" }],
  tags: [
    { name: "Auth", description: "Email OTP authentication and session management" },
    { name: "User", description: "Authenticated user data" },
    { name: "Storage", description: "Custom sticker artwork object storage" },
    { name: "Orders", description: "Server-authoritative order creation and retrieval" },
    { name: "Payments", description: "UPI payment confirmation and Stripe integration" },
    { name: "Admin", description: "Authenticated Stick Hive admin order controls" },
  ],
  paths: {
    "/api/auth/send-otp": {
      post: {
        tags: ["Auth"],
        summary: "Send an email OTP",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/SendOtpRequest" } } },
        },
        responses: {
          "200": { description: "OTP accepted for delivery" },
          "400": { description: "Invalid request" },
          "429": { description: "Resend cooldown" },
          "503": { description: "Server configuration missing" },
        },
      },
    },
    "/api/auth/verify-otp": {
      post: {
        tags: ["Auth"],
        summary: "Verify an email OTP and create a session",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/VerifyOtpRequest" } } },
        },
        responses: {
          "200": { description: "OTP verified and session created" },
          "400": { description: "Invalid/expired OTP" },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get the current authenticated user",
        responses: {
          "200": { description: "Authenticated user returned" },
          "401": { description: "No valid session" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Destroy the current session",
        responses: { "200": { description: "Session destroyed" } },
      },
    },
    "/api/wishlist": {
      get: {
        tags: ["User"],
        summary: "Get the authenticated user's wishlist",
        responses: {
          "200": { description: "Wishlist returned" },
          "401": { description: "Not authenticated" },
        },
      },
      put: {
        tags: ["User"],
        summary: "Replace the authenticated user's wishlist",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/WishlistRequest" } } },
        },
        responses: {
          "200": { description: "Wishlist updated" },
          "400": { description: "Invalid wishlist" },
          "401": { description: "Not authenticated" },
        },
      },
    },
    "/api/storage/upload-url": {
      post: {
        tags: ["Storage"],
        summary: "Create a presigned upload URL for custom sticker artwork",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UploadUrlRequest" } } },
        },
        responses: {
          "200": { description: "Presigned upload URL returned" },
          "400": { description: "Invalid file type or size" },
          "503": { description: "Storage is unavailable" },
        },
      },
    },
    "/api/storage/upload": {
      post: {
        tags: ["Storage"],
        summary: "Upload custom sticker artwork directly to object storage",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: { type: "string", format: "binary", description: "PNG, JPEG, or WebP; maximum 5 MB." },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Artwork uploaded" },
          "400": { description: "Missing, unsupported, or oversized file" },
          "401": { description: "Not authenticated" },
          "503": { description: "Storage is unavailable" },
        },
      },
    },
    "/api/storage/health": {
      get: {
        tags: ["Storage"],
        summary: "Check configured S3 storage",
        responses: {
          "200": { description: "Storage is available" },
          "503": { description: "Storage is unavailable" },
        },
      },
    },

    "/api/orders": {
      get: {
        tags: ["User"],
        summary: "Get the authenticated user's orders",
        responses: { "200": { description: "Orders returned" }, "401": { description: "Not authenticated" } },
      },
      post: {
        tags: ["Orders"],
        summary: "Create a server-authoritative order",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateOrderRequest" } } } },
        responses: { "201": { description: "Order created" }, "400": { description: "Invalid checkout data" }, "401": { description: "Not authenticated" } },
      },
    },
    "/api/orders/{orderId}": {
      get: {
        tags: ["Orders"],
        summary: "Get one order belonging to the current user",
        parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Order returned" }, "404": { description: "Order not found" } },
      },
    },
    "/api/orders/{orderId}/payment-claim": {
      post: {
        tags: ["Orders"],
        summary: "Record that the customer has submitted an UPI payment for an order",
        parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Payment confirmation recorded; admin verification is still required" }, "401": { description: "Not authenticated" }, "409": { description: "Order is unavailable for payment confirmation" } },
      },
    },
    "/api/admin/orders": {
      get: {
        tags: ["Admin"],
        summary: "List orders for the Stick Hive admin",
        responses: { "200": { description: "Admin order list returned" }, "401": { description: "Not authenticated" }, "403": { description: "Admin access required" } },
      },
    },
    "/api/admin/orders/{orderId}": {
      patch: {
        tags: ["Admin"],
        summary: "Update payment or fulfillment status for an order",
        parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { paymentStatus: { type: "string", enum: ["pending_confirmation", "paid", "failed", "cancelled", "refunded"] }, status: { type: "string", enum: ["placed", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"] }, shippingDetails: { type: "object", required: ["method"], properties: { method: { type: "string", enum: ["courier", "pickup", "local_delivery"] }, courier: { type: "string" }, trackingNumber: { type: "string" }, trackingUrl: { type: "string", format: "uri" }, pickupLocation: { type: "string" }, pickupInstructions: { type: "string" } } }, paymentVerification: { type: "object", required: ["transactionId", "paidAmount", "paidAt"], properties: { transactionId: { type: "string" }, utr: { type: "string" }, payerUpiId: { type: "string" }, payerName: { type: "string" }, paidAmount: { type: "number", format: "float" }, paidAt: { type: "string", format: "date-time" }, note: { type: "string" } } } } } } } },
        responses: { "200": { description: "Order updated" }, "401": { description: "Not authenticated" }, "403": { description: "Admin access required" }, "404": { description: "Order not found" } },
      },
    },
    "/api/payments/stripe/status": {
      get: { tags: ["Payments"], summary: "Check whether Stripe is configured", responses: { "200": { description: "Stripe configuration status" } } },
    },
    "/api/payments/stripe/checkout": {
      post: {
        tags: ["Payments"],
        summary: "Create a Stripe Checkout Session for an existing order",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["orderId"], properties: { orderId: { type: "string" } } } } } },
        responses: { "200": { description: "Stripe Checkout URL returned" }, "401": { description: "Not authenticated" }, "503": { description: "Stripe unavailable" } },
      },
    },
    "/api/payments/stripe/webhook": {
      post: { tags: ["Payments"], summary: "Stripe webhook receiver", responses: { "200": { description: "Webhook received" }, "400": { description: "Invalid webhook" } } },
    },
  },
  components: {
    schemas: {
      SendOtpRequest: {
        type: "object",
        required: ["email"],
        properties: { email: { type: "string", format: "email", example: "hello@stickhive.in" } },
      },
      WishlistRequest: {
        type: "object",
        required: ["productIds"],
        properties: {
          productIds: { type: "array", items: { type: "string" }, maxItems: 200 },
        },
      },
      UploadUrlRequest: {
        type: "object",
        required: ["contentType", "size"],
        properties: {
          contentType: { type: "string", example: "image/png" },
          size: { type: "integer", example: 184320, description: "File size in bytes; maximum 5 MB." },
        },
      },

      CreateOrderRequest: {
        type: "object",
        required: ["paymentMethod", "customer", "items"],
        properties: {
          paymentMethod: { type: "string", enum: ["upi", "stripe"] },
          customer: { type: "object" },
          items: { type: "array", items: { type: "object" } },
        },
      },
      VerifyOtpRequest: {
        type: "object",
        required: ["email", "code"],
        properties: {
          email: { type: "string", format: "email" },
          code: { type: "string", pattern: "^[0-9]{6}$", example: "123456" },
        },
      },
    },
  },
} as const;
