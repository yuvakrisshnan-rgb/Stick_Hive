export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-cream px-6 pb-20 pt-40">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-black/40">404</p>
        <h1 className="mt-3 text-5xl font-extrabold tracking-tight">Page not found</h1>
        <p className="mx-auto mt-4 max-w-md text-black/50">
          Sorry, we couldn&apos;t find the page you were looking for.
        </p>
        <a
          href="/"
          className="mt-8 inline-flex rounded-full bg-black px-6 py-3 text-sm font-bold text-white"
        >
          Back to Stick Hive
        </a>
      </div>
    </main>
  );
}
