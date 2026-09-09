"use client";

import { useState } from "react";
import AuthDialog from "./auth-dialog";
import { useAuth } from "./auth-provider";

export default function AuthDialogHost() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  // Expose a tiny event bridge so the existing navbar stays visually intact
  // while auth UI can be integrated without coupling layout to navigation.
  if (typeof window !== "undefined") {
    (window as Window & { __stickHiveOpenAuth?: () => void }).__stickHiveOpenAuth =
      () => setOpen(true);
  }

  if (user) {
    return null;
  }

  return <AuthDialog open={open} onClose={() => setOpen(false)} />;
}
