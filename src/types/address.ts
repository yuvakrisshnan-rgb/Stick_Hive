// ============================================================================
// STICKHIVE ADDRESS TYPE
// ============================================================================

export type Address = {
  id: string;

  addressLine1: string;

  addressLine2?: string;

  landmark?: string;

  city: string;

  state: string;

  pincode: string;

  isDefault: boolean;

  createdAt: string;

  updatedAt: string;
};