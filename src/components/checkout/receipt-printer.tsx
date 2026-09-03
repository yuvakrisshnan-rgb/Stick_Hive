"use client";

import {
  CheckCircleIcon,
  CircleNotchIcon,
} from "@phosphor-icons/react";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "motion/react";

import {
  type ComponentPropsWithoutRef,
  createContext,
  type ReactNode,
  useContext,
} from "react";

import { cn } from "@/helpers/classname-helper";

// --------------------------------------------------
// TYPES
// --------------------------------------------------

export type ReceiptPrinterStage = "processing" | "printing" | "complete";
export type ReceiptFeedMotion = "smooth" | "stepped";

export type ReceiptPrinterRootProps = Omit<
  ComponentPropsWithoutRef<"section">,
  "children"
> & {
  animate?: boolean;
  children: ReactNode;
  feedMotion?: ReceiptFeedMotion;
  stage: ReceiptPrinterStage;
};

export type ReceiptPrinterMachineProps = ComponentPropsWithoutRef<"div">;
export type ReceiptPrinterHeaderProps = ComponentPropsWithoutRef<"div">;
export type ReceiptPrinterScreenProps = ComponentPropsWithoutRef<"div">;
export type ReceiptPrinterOutputProps = ComponentPropsWithoutRef<"div">;
export type ReceiptPrinterPaperProps = ComponentPropsWithoutRef<"article">;

export type ReceiptPrinterOrderRowProps = {
  label: ReactNode;
  amount: ReactNode;
};

export type ReceiptPrinterStatusProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "children"
> & {
  children?: ReactNode;
};

// --------------------------------------------------
// CONTEXT
// --------------------------------------------------

type ReceiptPrinterContextValue = {
  animate: boolean;
  feedMotion: ReceiptFeedMotion;
  shouldMove: boolean;
  stage: ReceiptPrinterStage;
};

const ReceiptPrinterContext =
  createContext<ReceiptPrinterContextValue | null>(null);

// --------------------------------------------------
// EASING
// --------------------------------------------------

const easeOut = [0.23, 1, 0.32, 1] as const;
const easeInOut = [0.77, 0, 0.175, 1] as const;

// --------------------------------------------------
// RECEIPT TEETH (jagged bottom edge of the paper)
// --------------------------------------------------

const receiptToothCount = 24;
const receiptToothDepth = 4;

const receiptToothPoints = Array.from(
  { length: receiptToothCount * 2 },
  (_, index) => {
    const x = 100 - ((index + 1) * 100) / (receiptToothCount * 2);
    const y =
      index % 2 === 0 ? "100%" : `calc(100% - ${receiptToothDepth}px)`;

    return `${x}% ${y}`;
  },
).join(", ");

const receiptClipPath = `polygon(0 0, 100% 0, 100% calc(100% - ${receiptToothDepth}px), ${receiptToothPoints})`;

// --------------------------------------------------
// PRINTING SLIDE KEYFRAMES — paper feeds down in steps
// --------------------------------------------------

const printingTransformKeyframes = [
  "translateY(calc(-100% + 2px))",
  "translateY(-88%)",
  "translateY(-88%)",
  "translateY(-74%)",
  "translateY(-74%)",
  "translateY(-58%)",
  "translateY(-58%)",
  "translateY(-42%)",
  "translateY(-42%)",
  "translateY(-26%)",
  "translateY(-26%)",
  "translateY(-12%)",
  "translateY(-12%)",
  "translateY(0%)",
];

const printingKeyframeTimes = [
  0, 0.09, 0.14, 0.23, 0.28, 0.37, 0.42, 0.51, 0.56, 0.65, 0.7, 0.85, 0.9, 1,
];

const statusLabels: Record<ReceiptPrinterStage, ReactNode> = {
  processing: "Processing your order",
  printing: "Printing your receipt",
  complete: "Order complete",
};

const stageProgress: Record<ReceiptPrinterStage, number> = {
  processing: 0.25,
  printing: 0.75,
  complete: 1,
};

// --------------------------------------------------
// CONTEXT HOOK
// --------------------------------------------------

function useReceiptPrinter(component: string) {
  const context = useContext(ReceiptPrinterContext);

  if (!context) {
    throw new Error(`${component} must be used inside ReceiptPrinter.Root.`);
  }

  return context;
}

// --------------------------------------------------
// MACHINE STYLE — rounded card, no extra bottom padding so
// the card ends right at the slot bar (fix #1)
// --------------------------------------------------

const machineClassName =
  "relative isolate z-30 w-full overflow-hidden rounded-2xl border border-black bg-neutral-900 p-3 shadow-2xl";

// --------------------------------------------------
// ROOT
// --------------------------------------------------

function ReceiptPrinterRoot({
  "aria-label": ariaLabel = "Receipt printer",
  animate = true,
  children,
  className,
  feedMotion = "stepped",
  stage,
  ...props
}: ReceiptPrinterRootProps) {
  const shouldReduceMotion = useReducedMotion();

  const context = {
    animate,
    feedMotion,
    shouldMove: animate && !shouldReduceMotion,
    stage,
  };

  return (
    <ReceiptPrinterContext.Provider value={context}>
      <section
        aria-label={ariaLabel}
        className={cn(
          "relative isolate mx-auto flex w-full max-w-xs flex-col items-center",
          className,
        )}
        data-stage={stage}
        {...props}
      >
        {children}
      </section>
    </ReceiptPrinterContext.Provider>
  );
}

// --------------------------------------------------
// MACHINE — header + screen live here. Fixed size, never
// grows or shrinks regardless of receipt stage.
// --------------------------------------------------

function ReceiptPrinterMachine({
  children,
  className,
  ...props
}: ReceiptPrinterMachineProps) {
  return (
    <div className={cn(machineClassName, className)} {...props}>
      {children}

      {/* PRINTER SLOT — paper visually emerges from behind this bar.
          mb-1 added (fix #2) so the card's rounded corners don't
          clip it. */}
      <div
        aria-hidden="true"
        className="relative z-30 mx-auto -mt-1 mb-1 h-3 w-[92%] rounded-full bg-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"
      />
    </div>
  );
}

// --------------------------------------------------
// HEADER — just the logo mark
// --------------------------------------------------

function ReceiptPrinterHeader({
  children,
  className,
  ...props
}: ReceiptPrinterHeaderProps) {
  return (
    <div
      className={cn("relative z-10 flex h-9 items-center px-1", className)}
      {...props}
    >
      {children}
    </div>
  );
}

// --------------------------------------------------
// SCREEN — inset lighter panel holding order info,
// status, and the progress bar
// --------------------------------------------------

function ReceiptPrinterScreen({
  children,
  className,
  ...props
}: ReceiptPrinterScreenProps) {
  return (
    <div
      className={cn(
        "relative z-10 mt-2 w-full space-y-3 rounded-xl border border-white/10 bg-neutral-800 px-4 py-3.5",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// --------------------------------------------------
// ORDER ROW
// --------------------------------------------------

function ReceiptPrinterOrderRow({
  label,
  amount,
}: ReceiptPrinterOrderRowProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm font-bold text-white">{label}</p>

      <div className="text-right">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
          Total
        </p>
        <p className="text-sm font-extrabold text-white">{amount}</p>
      </div>
    </div>
  );
}

// --------------------------------------------------
// STATUS INDICATOR
// --------------------------------------------------

function StatusIndicator({
  animate,
  move,
  stage,
}: {
  animate: boolean;
  move: boolean;
  stage: ReceiptPrinterStage;
}) {
  const isComplete = stage === "complete";

  return (
    <span
      aria-hidden="true"
      className="relative grid size-4 shrink-0 place-items-center"
    >
      <AnimatePresence initial={false} mode="sync">
        {isComplete ? (
          <motion.span
            animate={{ opacity: 1, transform: "scale(1)" }}
            className="col-start-1 row-start-1 grid place-items-center text-green-500"
            exit={{
              opacity: animate ? 0 : 1,
              transform: move ? "scale(0.96)" : "scale(1)",
            }}
            initial={{
              opacity: animate ? 0 : 1,
              transform: move ? "scale(0.94)" : "scale(1)",
            }}
            key="complete"
            transition={{ duration: animate ? 0.16 : 0, ease: easeOut }}
          >
            <CheckCircleIcon size={16} weight="fill" />
          </motion.span>
        ) : (
          <motion.span
            animate={{ opacity: 1, transform: "scale(1)" }}
            className="col-start-1 row-start-1 grid place-items-center text-white/50"
            exit={{
              opacity: animate ? 0 : 1,
              transform: move ? "scale(0.96)" : "scale(1)",
            }}
            initial={{
              opacity: animate ? 0 : 1,
              transform: move ? "scale(0.94)" : "scale(1)",
            }}
            key="working"
            transition={{ duration: animate ? 0.16 : 0, ease: easeOut }}
          >
            <CircleNotchIcon
              className={cn(animate && "animate-spin")}
              size={16}
              weight="bold"
            />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

// --------------------------------------------------
// STATUS
// --------------------------------------------------

function ReceiptPrinterStatus({
  children,
  className,
  ...props
}: ReceiptPrinterStatusProps) {
  const { animate, shouldMove, stage } = useReceiptPrinter(
    "ReceiptPrinter.Status",
  );

  return (
    <div
      className={cn("flex min-w-0 items-center gap-2", className)}
      {...props}
    >
      <StatusIndicator animate={animate} move={shouldMove} stage={stage} />

      <div
        aria-live="polite"
        className="grid min-w-0 flex-1 items-center"
        role="status"
      >
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            className="col-start-1 row-start-1 truncate text-xs font-medium text-white/70"
            exit={{
              opacity: animate ? 0 : 1,
              transform: shouldMove ? "translateY(-4px)" : "translateY(0px)",
            }}
            initial={{
              opacity: animate ? 0 : 1,
              transform: shouldMove ? "translateY(4px)" : "translateY(0px)",
            }}
            key={stage}
          >
            {children ?? statusLabels[stage]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// --------------------------------------------------
// PROGRESS BAR
// --------------------------------------------------

function ReceiptPrinterProgressBar() {
  const { shouldMove, stage } = useReceiptPrinter(
    "ReceiptPrinter.ProgressBar",
  );

  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
      <motion.div
        className="h-full rounded-full bg-sky-400"
        animate={{ width: `${stageProgress[stage] * 100}%` }}
        transition={{
          duration: shouldMove ? 0.6 : 0,
          ease: easeOut,
        }}
      />
    </div>
  );
}

// --------------------------------------------------
// PAPER
// --------------------------------------------------

function ReceiptPrinterPaper({
  children,
  className,
  style,
  ...props
}: ReceiptPrinterPaperProps) {
  return (
    <article
      className={cn(
        "relative bg-neutral-100 px-5 pt-6 pb-7 font-mono uppercase tracking-wide text-black shadow-[0_12px_24px_rgba(0,0,0,0.18)]",
        className,
      )}
      style={{ clipPath: receiptClipPath, ...style }}
      {...props}
    >
      {children}
    </article>
  );
}

// --------------------------------------------------
// OUTPUT — sibling of Machine, pulled up with inline
// marginTop (fix #3) instead of a Tailwind step, so the
// gap can be tuned precisely in pixels.
// --------------------------------------------------

function ReceiptPrinterOutput({
  children,
  className,
  ...props
}: ReceiptPrinterOutputProps) {
  const { animate, feedMotion, shouldMove, stage } = useReceiptPrinter(
    "ReceiptPrinter.Output",
  );

  const isReceiptVisible = stage !== "processing";
  const shouldUseSteppedFeed =
    feedMotion === "stepped" && stage === "printing" && shouldMove;

  return (
    <div
      className={cn("relative z-10 w-[88%] overflow-hidden", className)}
      style={{ marginTop: "-8px" }}
      {...props}
    >
      <motion.div
        animate={{
          opacity: isReceiptVisible ? 1 : 0,
          transform:
            stage === "printing" && shouldMove
              ? shouldUseSteppedFeed
                ? printingTransformKeyframes
                : "translateY(0%)"
              : isReceiptVisible || !shouldMove
                ? "translateY(0%)"
                : "translateY(calc(-100% + 2px))",
        }}
        aria-hidden={stage === "processing"}
        initial={false}
        transition={{
          opacity: { duration: animate ? 0.16 : 0, ease: easeOut },
          transform: {
            duration: shouldMove ? 1.6 : 0,
            ease: shouldUseSteppedFeed ? "linear" : easeInOut,
            times: shouldUseSteppedFeed ? printingKeyframeTimes : undefined,
          },
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// --------------------------------------------------
// EXPORT
// --------------------------------------------------

export const ReceiptPrinter = {
  Header: ReceiptPrinterHeader,
  Machine: ReceiptPrinterMachine,
  OrderRow: ReceiptPrinterOrderRow,
  Output: ReceiptPrinterOutput,
  Paper: ReceiptPrinterPaper,
  ProgressBar: ReceiptPrinterProgressBar,
  Root: ReceiptPrinterRoot,
  Screen: ReceiptPrinterScreen,
  Status: ReceiptPrinterStatus,
};