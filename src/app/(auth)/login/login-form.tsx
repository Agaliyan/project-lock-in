"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "../actions";
import Link from "next/link";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    const result = await signIn(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/");
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="login-email"
          className="mb-1.5 block text-sm font-medium text-text-secondary"
        >
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="hover-border focus-ring w-full bg-card px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="login-password"
          className="mb-1.5 block text-sm font-medium text-text-secondary"
        >
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="hover-border focus-ring w-full bg-card px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="hover-border w-full bg-card-alt px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-card disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-center text-sm text-text-muted">
        No account?{" "}
        <Link
          href="/signup"
          className="text-text-secondary underline-offset-4 hover:text-text-primary hover:underline"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}
