import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
          Lock In
        </h1>
        <p className="mt-2 font-body text-sm text-text-secondary">
          Create your account and stop procrastinating.
        </p>
      </div>
      <SignupForm />
    </div>
  );
}
