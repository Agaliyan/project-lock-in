import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
          Lock In
        </h1>
        <p className="mt-2 font-body text-sm text-text-secondary">
          Sign in to get back to work.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
