"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "../(auth)/actions";

interface AppShellProps {
  userEmail: string;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/", label: "Right Now" },
  { href: "/schedule", label: "Schedule" },
  { href: "/life-areas", label: "Life Areas" },
  { href: "/tasks", label: "All Tasks" },
];

export function AppShell({ userEmail, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-app-bg">
      {/* Top nav bar */}
      <header className="border-b border-border-default px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-display text-xl font-semibold tracking-tight text-text-primary">
              Lock In
            </Link>
            <nav className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-card-alt text-text-primary"
                        : "text-text-muted hover:text-text-secondary"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-data text-xs text-text-muted">{userEmail}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="hover-border bg-card px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
