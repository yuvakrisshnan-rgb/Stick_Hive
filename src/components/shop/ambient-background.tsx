// ============================================================================
// SHOP AMBIENT BACKGROUND
// ============================================================================
//
// Replaces the never-working GSAP/OGL "Threads" WebGL background (which
// never actually shipped in this codebase — no `ogl` dependency, no
// matching component existed to fix). This is a plain CSS alternative:
// three large, blurred, brand-colored blobs that drift slowly behind the
// product grid via the `animate-ambient-drift-*` keyframes in globals.css.
//
// Deliberately not Canvas/WebGL — this project already burned a debugging
// cycle on a WebGL background that never rendered, so a static, server-
// renderable, GPU-cheap CSS treatment is the lower-risk choice here. It
// needs no client JS, so this file carries no "use client" directive.
//
// Fixed (not absolute) so it stays put behind the whole page — hero and
// scrolling product grid alike — without needing to match content height.
// ============================================================================

export default function ShopAmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div
        className="animate-ambient-drift-a absolute -left-24 top-[-4rem] size-[420px] rounded-full bg-hive-yellow/25 blur-[110px]"
      />

      <div
        className="animate-ambient-drift-b absolute right-[-6rem] top-1/3 size-[380px] rounded-full bg-mint/30 blur-[110px]"
      />

      <div
        className="animate-ambient-drift-c absolute bottom-[-5rem] left-1/3 size-[440px] rounded-full bg-[#0f3d3d]/10 blur-[120px]"
      />
    </div>
  );
}
