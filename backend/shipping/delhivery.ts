import type { OrderDocument } from "../orders/service";
import { loadOrderByTrackingNumber, updateOrderShippingAndStatus } from "../orders/service";

const TRACKING_URL_BASE = "https://www.delhivery.com/track/package";

function env(name: string, required = true) {
  const value = process.env[name]?.trim();
  if (required && !value) throw new Error(`${name} is not configured.`);
  return value || "";
}

export function delhiveryBaseUrl() {
  return process.env.DELHIVERY_ENV?.trim().toLowerCase() === "staging"
    ? "https://staging-express.delhivery.com"
    : "https://track.delhivery.com";
}

export function delhiveryTrackingUrl(waybill: string) {
  return `${TRACKING_URL_BASE}/${encodeURIComponent(waybill)}`;
}

function cleanText(value: string, max = 500) {
  return value.replace(/[&#%;\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function assertResponseOk(response: Response, bodyText: string) {
  if (!response.ok) {
    let detail = bodyText;
    try {
      const parsed = JSON.parse(bodyText);
      detail = parsed?.error || parsed?.message || parsed?.remarks || bodyText;
    } catch {
      // Keep raw text.
    }
    throw new Error(`Delhivery API error (${response.status}): ${String(detail).slice(0, 500)}`);
  }
}

async function parseResponse(response: Response) {
  const bodyText = await response.text();
  assertResponseOk(response, bodyText);
  try {
    return JSON.parse(bodyText) as Record<string, any>;
  } catch {
    return { raw: bodyText };
  }
}

function extractWaybill(payload: Record<string, any>) {
  const candidates = [
    payload?.waybill,
    payload?.wbn,
    payload?.packages?.[0]?.waybill,
    payload?.packages?.[0]?.wbn,
    payload?.packages?.[0]?.status?.waybill,
    payload?.Shipment?.AWB,
  ];
  const waybill = candidates.find((value) => typeof value === "string" && value.trim());
  return waybill?.trim() || "";
}

export type DelhiveryShipmentInput = {
  pickupLocation?: string;
  weightGrams: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
};

export async function createDelhiveryShipment(order: OrderDocument, input: DelhiveryShipmentInput) {
  const token = env("DELHIVERY_API_TOKEN");
  const clientName = env("DELHIVERY_CLIENT_NAME");
  const pickupLocation = cleanText(input.pickupLocation || env("DELHIVERY_PICKUP_LOCATION"), 120);

  if (!Number.isFinite(input.weightGrams) || input.weightGrams <= 0 || input.weightGrams > 500000) {
    throw new Error("Enter a valid package weight in grams.");
  }
  for (const [label, value] of [["length", input.lengthCm], ["width", input.widthCm], ["height", input.heightCm]] as const) {
    if (!Number.isFinite(value) || value <= 0 || value > 300) throw new Error(`Enter a valid package ${label}.`);
  }
  if (!pickupLocation) throw new Error("Delhivery pickup location is not configured.");

  const buyer = order.customer;
  const address = [buyer.address.addressLine1, buyer.address.addressLine2, buyer.address.landmark].filter(Boolean).join(", ");
  const productDescription = order.items.map((item) => `${cleanText(item.productName, 100)} x${item.quantity}`).join(", ");
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);

  const shipment = {
    waybill: "",
    order: order.orderId,
    order_date: order.createdAt.toISOString(),
    name: cleanText(buyer.name, 100),
    phone: buyer.phone,
    email: buyer.email,
    add: cleanText(address, 500),
    city: cleanText(buyer.address.city, 80),
    state: cleanText(buyer.address.state, 80),
    pin: buyer.address.pincode,
    country: "India",
    payment_mode: "Pre-paid",
    cod_amount: 0,
    total_amount: order.total,
    quantity: totalQuantity,
    weight: Number((input.weightGrams / 1000).toFixed(3)),
    shipment_length: input.lengthCm,
    shipment_width: input.widthCm,
    shipment_height: input.heightCm,
    product_type: "Express",
    products_desc: cleanText(productDescription, 500),
    seller_name: env("DELHIVERY_SELLER_NAME", false),
    seller_add: cleanText(env("DELHIVERY_SELLER_ADDRESS", false), 500),
    seller_pin: env("DELHIVERY_SELLER_PIN", false),
    seller_inv: order.orderId,
    seller_inv_date: new Date().toISOString().slice(0, 10),
    source: "StickHive",
  };

  const sellerGstTin = env("DELHIVERY_SELLER_GST_TIN", false);
  const hsnCode = env("DELHIVERY_HSN_CODE", false);
  if (sellerGstTin) (shipment as any).seller_tin = sellerGstTin;
  if (hsnCode) (shipment as any).hsn_code = hsnCode;

  const response = await fetch(`${delhiveryBaseUrl()}/api/cmu/create.json`, {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      format: "json",
      data: JSON.stringify({ client: clientName, pickup_location: { name: pickupLocation }, shipments: [shipment] }),
    }),
    cache: "no-store",
  });

  const payload = await parseResponse(response);
  const waybill = extractWaybill(payload);
  if (!waybill) throw new Error(`Shipment was not assigned a Delhivery AWB. Response: ${JSON.stringify(payload).slice(0, 800)}`);

  return { waybill, trackingUrl: delhiveryTrackingUrl(waybill), pickupLocation, raw: payload };
}

export async function scheduleDelhiveryPickup(params: {
  pickupLocation: string;
  pickupDate: string;
  pickupTime: string;
  expectedPackageCount: number;
}) {
  const token = env("DELHIVERY_API_TOKEN");
  if (!params.pickupLocation?.trim()) throw new Error("Pickup location is required.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(params.pickupDate)) throw new Error("Enter a valid pickup date.");
  if (!/^\d{2}:\d{2}:\d{2}$/.test(params.pickupTime)) throw new Error("Enter pickup time as HH:MM:SS.");
  if (!Number.isInteger(params.expectedPackageCount) || params.expectedPackageCount < 1) throw new Error("Expected package count must be at least 1.");

  const response = await fetch(`${delhiveryBaseUrl()}/fm/request/new/`, {
    method: "POST",
    headers: { Authorization: `Token ${token}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      pickup_time: params.pickupTime,
      pickup_date: params.pickupDate,
      pickup_location: params.pickupLocation.trim(),
      expected_package_count: params.expectedPackageCount,
    }),
    cache: "no-store",
  });

  return parseResponse(response);
}

export async function trackDelhiveryShipment(waybill: string) {
  const token = env("DELHIVERY_API_TOKEN");
  const url = new URL(`${delhiveryBaseUrl()}/api/v1/packages/json/`);
  url.searchParams.set("waybill", waybill);
  url.searchParams.set("ref_ids", "");
  const response = await fetch(url, {
    headers: { Authorization: `Token ${token}`, Accept: "application/json" },
    cache: "no-store",
  });
  return parseResponse(response);
}

export function extractTrackingEvent(payload: Record<string, any>) {
  const shipment = payload?.Shipment ?? payload?.shipment ?? payload?.data?.Shipment ?? payload?.data?.shipment ?? payload;
  const status = shipment?.Status ?? shipment?.status ?? {};
  return {
    awb: String(shipment?.AWB ?? shipment?.awb ?? shipment?.waybill ?? payload?.AWB ?? "").trim(),
    status: String(status?.Status ?? status?.status ?? shipment?.status ?? payload?.status ?? "").trim(),
    statusType: String(status?.StatusType ?? status?.statusType ?? "").trim(),
    location: String(status?.StatusLocation ?? status?.location ?? "").trim(),
    instructions: String(status?.Instructions ?? status?.instructions ?? "").trim(),
    statusDateTime: String(status?.StatusDateTime ?? status?.statusDateTime ?? "").trim(),
    raw: payload,
  };
}

export function mapDelhiveryStatus(rawStatus: string) {
  const status = rawStatus.toLowerCase().replace(/[_-]/g, " ").trim();
  if (status.includes("delivered")) return "delivered" as const;
  if (status.includes("out for delivery")) return "out_for_delivery" as const;
  if (status.includes("picked up") || status.includes("pickedup") || status.includes("dispatched") || status.includes("in transit") || status.includes("intransit") || status.includes("received")) return "shipped" as const;
  return null;
}

export async function applyDelhiveryTrackingEvent(event: ReturnType<typeof extractTrackingEvent>) {
  if (!event.awb) throw new Error("Tracking event did not contain an AWB.");
  const order = await loadOrderByTrackingNumber(event.awb);
  if (!order) return { matched: false };

  const mapped = mapDelhiveryStatus(event.status);
  const current = order.shippingDetails;
  const shippingDetails = {
    ...(current ?? { method: "courier" as const, courier: "Delhivery", trackingNumber: event.awb, trackingUrl: delhiveryTrackingUrl(event.awb) }),
    courier: "Delhivery",
    trackingNumber: event.awb,
    trackingUrl: current?.trackingUrl || delhiveryTrackingUrl(event.awb),
    lastCarrierStatus: event.status || current?.lastCarrierStatus,
    lastCarrierLocation: event.location || current?.lastCarrierLocation,
    lastCarrierStatusAt: event.statusDateTime ? new Date(event.statusDateTime) : current?.lastCarrierStatusAt,
    updatedAt: new Date(),
    ...(mapped === "shipped" ? { shippedAt: current?.shippedAt ?? new Date() } : {}),
    ...(mapped === "delivered" ? { deliveredAt: current?.deliveredAt ?? new Date() } : {}),
  } as NonNullable<OrderDocument["shippingDetails"]>;

  let nextStatus: OrderDocument["status"] | undefined;
  if (mapped) {
    const precedence: Record<string, number> = { placed: 1, processing: 2, packed: 3, shipped: 4, out_for_delivery: 5, delivered: 6, cancelled: 99 };
    const currentRank = precedence[order.status] ?? 0;
    const nextRank = precedence[mapped] ?? currentRank;
    if (nextRank >= currentRank) nextStatus = mapped;
  }
  const emailNeeded = mapped === "out_for_delivery" && !current?.outForDeliveryEmailSentAt;
  await updateOrderShippingAndStatus(order.orderId, shippingDetails, nextStatus);
  return { matched: true, orderId: order.orderId, mappedStatus: mapped, email: order.customer.email, customerName: order.customer.name, shippingDetails, emailNeeded };
}

export function webhookSecretMatches(request: Request) {
  const secret = process.env.DELHIVERY_WEBHOOK_SECRET?.trim();
  if (!secret) return true;
  const auth = request.headers.get("authorization")?.trim() || "";
  const xSecret = request.headers.get("x-stickhive-webhook-secret")?.trim() || "";
  return auth === `Token ${secret}` || auth === `Bearer ${secret}` || xSecret === secret;
}
