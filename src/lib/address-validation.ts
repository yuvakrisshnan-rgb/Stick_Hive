// ============================================================================
// PIN CODE LOOKUP
// ============================================================================
// Uses India Post's public API to verify a PIN code genuinely exists,
// and returns the real city/state so the form can auto-fill them.
// Free, no API key required.

export type PincodeLookupResult = {
  valid: boolean;
  city?: string;
  state?: string;
  error?: string;
};

export async function lookupPincode(
  pincode: string,
): Promise<PincodeLookupResult> {
  if (!/^[1-9]\d{5}$/.test(pincode)) {
    return { valid: false, error: "Enter a valid 6-digit PIN code." };
  }

  try {
    const response = await fetch(
      `https://api.postalpincode.in/pincode/${pincode}`,
    );

    if (!response.ok) {
      return {
        valid: false,
        error: "Unable to verify PIN code right now.",
      };
    }

    const data = await response.json();
    const result = Array.isArray(data) ? data[0] : null;

    if (!result || result.Status !== "Success" || !result.PostOffice?.length) {
      return {
        valid: false,
        error: "This PIN code doesn't seem to exist. Please check it.",
      };
    }

    const firstOffice = result.PostOffice[0];

    return {
      valid: true,
      city: firstOffice.District,
      state: firstOffice.State,
    };
  } catch (error) {
    console.error("PIN code lookup failed:", error);

    return {
      valid: false,
      error: "Unable to verify PIN code. Check your connection and try again.",
    };
  }
}


// ============================================================================
// TIGHTENED FORMAT VALIDATION
// ============================================================================

export function isLikelyValidIndianMobile(phone: string): boolean {
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return false;
  }

  const allSameDigit = /^(\d)\1{9}$/.test(phone);
  const sequential =
    "0123456789".includes(phone) ||
    "9876543210".includes(phone);

  return !allSameDigit && !sequential;
}

export function isLikelyValidEmail(email: string): boolean {
  const basicFormat = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

  if (!basicFormat) {
    return false;
  }

  const [localPart, domain] = email.split("@");

  if (
    localPart.startsWith(".") ||
    localPart.endsWith(".") ||
    localPart.includes("..")
  ) {
    return false;
  }

  const disposableDomains = [
    "mailinator.com",
    "guerrillamail.com",
    "10minutemail.com",
    "tempmail.com",
    "throwawaymail.com",
  ];

  if (disposableDomains.includes(domain.toLowerCase())) {
    return false;
  }

  return true;
}