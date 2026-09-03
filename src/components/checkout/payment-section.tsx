"use client";

import { useState } from "react";

import PaymentProcessingAnimation from "./payment-processing-animation";
import type { StoredOrder } from "@/types/order";

const paymentMethods = [
  { id: "upi", label: "UPI", description: "Pay using UPI apps" },
  {
    id: "card",
    label: "Credit / Debit Card",
    description: "Visa, Mastercard and more",
  },
];

type PaymentSectionProps = {
  onValidateOrder: (paymentMethod: string) => StoredOrder | null;
  onOrderComplete: (order: StoredOrder) => void;
};

export default function PaymentSection({
  onValidateOrder,
  onOrderComplete,
}: PaymentSectionProps) {
  const [selectedPayment, setSelectedPayment] = useState("upi");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<StoredOrder | null>(null);

  function handleContinue() {
    const order = onValidateOrder(selectedPayment);

    if (!order) {
      // validation failed — errors are already shown on CustomerForm
      return;
    }

    setPendingOrder(order);
    setProcessingPayment(true);
  }

  function finishPayment() {
    setProcessingPayment(false);

    if (pendingOrder) {
      onOrderComplete(pendingOrder);
    }
  }

  return (
    <section className="rounded-[2rem] bg-white p-8 shadow-xl">
      <h2 className="text-2xl font-extrabold">Payment Method</h2>

      <div className="mt-6 space-y-3">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => setSelectedPayment(method.id)}
            className={
              selectedPayment === method.id
                ? "flex w-full items-center gap-4 rounded-2xl border border-black bg-black p-4 text-left text-white transition"
                : "flex w-full items-center gap-4 rounded-2xl border border-black/10 p-4 text-left transition hover:bg-black/5"
            }
          >
            <div className="flex size-5 items-center justify-center rounded-full border">
              {selectedPayment === method.id && (
                <div className="size-2 rounded-full bg-white" />
              )}
            </div>

            <div>
              <p className="font-bold">{method.label}</p>
              <p className="text-sm opacity-70">{method.description}</p>
            </div>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleContinue}
        className="mt-8 w-full rounded-full bg-black py-4 font-bold text-white transition hover:scale-[1.02] active:scale-[0.98]"
      >
        Continue To Payment
      </button>

      <PaymentProcessingAnimation
        show={processingPayment}
        order={pendingOrder}
        onComplete={finishPayment}
      />
    </section>
  );
}