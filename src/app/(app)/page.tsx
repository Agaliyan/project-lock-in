import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
        Home
      </h2>
      <p className="mt-2 text-sm text-text-secondary">
        The &ldquo;Right Now&rdquo; view is coming in a later slice. For now, use the pages below.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/life-areas"
          className="hover-border flex flex-col gap-2 bg-card px-5 py-5 transition-colors"
        >
          <span className="font-display text-lg font-semibold text-text-primary">
            Life Areas
          </span>
          <span className="text-sm text-text-secondary">
            Manage your areas and their tasks
          </span>
        </Link>

        <Link
          href="/tasks"
          className="hover-border flex flex-col gap-2 bg-card px-5 py-5 transition-colors"
        >
          <span className="font-display text-lg font-semibold text-text-primary">
            All Tasks
          </span>
          <span className="text-sm text-text-secondary">
            View and filter every task across all areas
          </span>
        </Link>
      </div>
    </div>
  );
}
