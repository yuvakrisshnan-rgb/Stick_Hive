import { chromium } from "playwright";

const BASE = "http://localhost:3001";
const EMAIL = `checkout-verify-${Date.now()}@example.com`;

const browser = await chromium.launch();
const page = await browser.newPage();
page.on("console", (msg) => {
  if (msg.type() === "warning" || msg.type() === "error") {
    console.log(`[console ${msg.type()}]`, msg.text());
  }
});

// --- Sign in via debug OTP (AUTH_DEBUG_OTP=true, RESEND_API_KEY unset for this run) ---
const sendRes = await page.request.post(`${BASE}/api/auth/send-otp`, { data: { email: EMAIL } });
const sendBody = await sendRes.json();
console.log("send-otp:", sendRes.status(), sendBody);
const code = sendBody.debugCode;
if (!code) throw new Error("No debugCode returned - AUTH_DEBUG_OTP path not active");

const verifyRes = await page.request.post(`${BASE}/api/auth/verify-otp`, { data: { email: EMAIL, code } });
console.log("verify-otp:", verifyRes.status(), await verifyRes.json());

// --- Add the D1 product to cart via the real UI ---
await page.goto(`${BASE}/shop/eat-sleep-anime-repeat`);
await page.waitForTimeout(800); // let /api/products resolve
await page.getByRole("button", { name: /add to cart/i }).click();
await page.waitForTimeout(500);

const cartRaw = await page.evaluate(() => localStorage.getItem("stickhive:cart"));
console.log("cart after add:", cartRaw);
if (!cartRaw || cartRaw === "[]") throw new Error("FAIL: cart is still empty after Add to Cart");

// --- Go to checkout, fill the form ---
await page.goto(`${BASE}/checkout`);
const form = page.getByTestId("checkout-form");
await form.getByLabel(/full name/i).fill("Checkout Verify");
await form.getByLabel(/email/i).fill(EMAIL);
await form.getByLabel(/phone/i).fill("9123456780");
await form.getByLabel(/address line 1/i).fill("123 Verify Street");
await form.getByLabel(/pin code/i).fill("110001");
await page.waitForTimeout(1500); // pincode lookup autofill

// --- Verify email OTP within checkout ---
const [otpResponse] = await Promise.all([
  page.waitForResponse((res) => res.url().includes("/api/send-email-otp")),
  form.getByRole("button", { name: /^verify$/i }).click(),
]);
const otpBody = await otpResponse.json();
console.log("checkout send-email-otp:", otpResponse.status(), otpBody);
const checkoutCode = otpBody.debugCode;
if (!checkoutCode) throw new Error("No debugCode for checkout email verification");

const codeInput = page.getByPlaceholder("6-digit code");
await codeInput.waitFor({ state: "visible", timeout: 10000 });
await codeInput.fill(checkoutCode);
await page.getByRole("button", { name: /^confirm$/i }).click();
await page.getByText(/^verified$/i).waitFor({ state: "visible", timeout: 10000 });
console.log("Email verified badge is visible");

// --- Select UPI and place the order ---
await page.getByRole("button", { name: /upi \(direct\)/i }).click();
await page.waitForTimeout(300);

const placeOrderBtn = page.getByRole("button", { name: /place order with upi/i });
await placeOrderBtn.scrollIntoViewIfNeeded();
await placeOrderBtn.waitFor({ state: "visible", timeout: 10000 });
console.log("Place-order button disabled?", await placeOrderBtn.isDisabled());
console.log("Address fields:", await page.evaluate(() => ({
  city: document.querySelector("#checkout-city")?.value,
  state: document.querySelector("#checkout-state")?.value,
})));
console.log("Any red error text on page:", await page.evaluate(() =>
  Array.from(document.querySelectorAll(".text-red-500, .text-red-600")).map((el) => el.textContent),
));

const [ordersResponse] = await Promise.all([
  page.waitForResponse((res) => res.url().includes("/api/orders"), { timeout: 15000 }).catch((e) => {
    console.log("No /api/orders response observed:", e.message);
    return null;
  }),
  placeOrderBtn.click().catch((e) => console.log("click() threw:", e.message)),
]);

if (ordersResponse) {
  console.log("POST /api/orders:", ordersResponse.status());
  console.log(JSON.stringify(await ordersResponse.json(), null, 2));
}

await page.waitForTimeout(1500);
console.log("URL after placing order:", page.url());
await page.screenshot({ path: "scripts/_verify-checkout-result.png", fullPage: true });

const orderErrorText = await page.locator('[role="alert"]').first().textContent().catch(() => null);
if (orderErrorText) console.log("orderError on page:", orderErrorText);

await browser.close();
