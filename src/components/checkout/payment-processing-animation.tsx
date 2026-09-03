"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { ReceiptPrinter } from "./receipt-printer";
import type { StoredOrder } from "@/types/order";

type PaymentProcessingAnimationProps = {
  show: boolean;
  order: StoredOrder | null;
  onComplete: () => void;
};

const barcodeBarWidths = [
  2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 1, 2, 3, 1, 1, 2, 1, 3, 1, 2, 1, 1,
  3, 2, 1, 2, 1, 1, 3, 1, 2,
];

function DecorativeBarcode() {
  return (
    <div className="mt-1 flex h-10 items-stretch justify-center gap-[2px]">
      {barcodeBarWidths.map((width, index) => (
        <div key={index} className="bg-black" style={{ width: `${width}px` }} />
      ))}
    </div>
  );
}

function DashedDivider() {
  return <div className="my-2 border-t border-dashed border-black/30" />;
}

export default function PaymentProcessingAnimation({
  show,
  order,
  onComplete,
}: PaymentProcessingAnimationProps) {
  const [stage, setStage] = useState<"processing" | "printing" | "complete">(
    "processing",
  );

  useEffect(() => {
    if (!show) {
      setStage("processing");
      return;
    }

    const printTimer = setTimeout(() => setStage("printing"), 1200);
    const completeTimer = setTimeout(() => setStage("complete"), 3200);
    const finishTimer = setTimeout(() => onComplete(), 4500);

    return () => {
      clearTimeout(printTimer);
      clearTimeout(completeTimer);
      clearTimeout(finishTimer);
    };
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && order && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <ReceiptPrinter.Root stage={stage} feedMotion="stepped">
            {/* MACHINE — logo only in header, order info + status
                + progress bar live in the inset screen panel */}
            <ReceiptPrinter.Machine>
              <ReceiptPrinter.Header>
                <div className="flex size-7 items-center justify-center rounded-md bg-hive-yellow text-sm">
                  🐝
                </div>
              </ReceiptPrinter.Header>

              <ReceiptPrinter.Screen>
                <ReceiptPrinter.OrderRow
                  label={`Order #${order.orderId}`}
                  amount={`₹${order.total}`}
                />

                <ReceiptPrinter.Status />

                <ReceiptPrinter.ProgressBar />
              </ReceiptPrinter.Screen>
            </ReceiptPrinter.Machine>

            {/* OUTPUT — sibling of Machine, paper slides out below it */}
            <ReceiptPrinter.Output>
              <ReceiptPrinter.Paper>
                <div className="flex flex-col gap-2 font-mono text-xs">
                  {/* LOGO MARK */}
                  <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-black text-xl">
                    🐝
                  </div>

                  <div className="text-center">
                    <h3 className="text-lg font-black tracking-wide">
                      StickHive
                    </h3>
                    <p className="mt-1 normal-case text-black/50">
                      Order #{order.orderId}
                    </p>
                    <p className="normal-case text-black/50">
                      {new Date(order.createdAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>

                  <DashedDivider />

                  <div className="space-y-2 normal-case">
                    {order.items.map((item, index) => (
                      <div
                        key={`${item.productName}-${index}`}
                        className="flex items-start justify-between gap-3"
                      >
                        <div>
                          <p className="font-bold uppercase">
                            {item.productName}
                          </p>
                          <p className="text-black/50">
                            {[item.size, item.shape, item.finish]
                              .filter(Boolean)
                              .join(" · ")}
                            {" × "}
                            {item.quantity}
                          </p>
                        </div>

                        <p className="whitespace-nowrap font-bold">
                          ₹{item.lineTotal}
                        </p>
                      </div>
                    ))}
                  </div>

                  <DashedDivider />

                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{order.subtotal}</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>
                        {order.shipping === 0 ? "FREE" : `₹${order.shipping}`}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm font-black">
                      <span>Total Paid</span>
                      <span>₹{order.total}</span>
                    </div>
                  </div>

                  <DashedDivider />

                  <div className="flex justify-between normal-case text-black/50">
                    <span>Order</span>
                    <span>{order.orderId}</span>
                  </div>

                  <div className="flex justify-between text-black/50">
                    <span>Paid via</span>
                    <span>{order.paymentMethod.toUpperCase()}</span>
                  </div>

                  <p className="text-center font-bold">
                    Thank you for your order!
                  </p>

                  <DecorativeBarcode />
                </div>
              </ReceiptPrinter.Paper>
            </ReceiptPrinter.Output>
          </ReceiptPrinter.Root>
        </motion.div>
      )}
    </AnimatePresence>
  );
}