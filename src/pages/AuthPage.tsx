import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Brand } from "../components/Brand";

type AuthPageProps = {
  mode: "signin" | "signup" | "forgot";
};

export function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetRequested, setResetRequested] = useState(false);
  const isSignup = mode === "signup";
  const isForgotPassword = mode === "forgot";

  const pageContent = getAuthPageContent(mode);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Brand />
        <Link className="text-sm font-semibold text-slate-600 hover:text-slate-950" to="/">
          Back home
        </Link>
      </div>

      <section className="mx-auto grid max-w-6xl gap-10 py-14 lg:grid-cols-[0.9fr_1fr] lg:items-center">
        <aside className="hidden lg:block">
          <p className="section-eyebrow">{pageContent.eyebrow}</p>
          <h1 className="mt-4 max-w-xl text-5xl font-semibold leading-tight tracking-tight">
            {pageContent.heroTitle}
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
            {pageContent.heroBody}
          </p>
        </aside>

        <div className="mx-auto w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div>
            <p className="section-eyebrow">{pageContent.formEyebrow}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              {pageContent.formTitle}
            </h2>
            <p className="mt-3 text-slate-600">
              {pageContent.formBody}
            </p>
          </div>

          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (isForgotPassword) {
                setResetRequested(true);
                return;
              }

              navigate("/dashboard");
            }}
          >
            {isSignup ? (
              <label className="form-field">
                <span>Business name</span>
                <input type="text" placeholder="Bright Studio" autoComplete="organization" required />
              </label>
            ) : null}

            <label className="form-field">
              <span>Email</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setResetRequested(false);
                }}
                autoComplete="email"
                required
              />
            </label>

            {!isForgotPassword ? (
              <label className="form-field">
                <span>Password</span>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  required
                />
              </label>
            ) : null}

            {!isForgotPassword ? (
              <div className="flex items-center justify-between gap-4 text-sm text-slate-600">
                <label className="flex items-center gap-2">
                  <input className="h-4 w-4 accent-slate-950" type="checkbox" />
                  {isSignup ? "Accept terms" : "Remember me"}
                </label>
                {!isSignup ? (
                  <Link className="font-semibold text-slate-950" to="/forgot-password">
                    Forgot password?
                  </Link>
                ) : null}
              </div>
            ) : null}

            {resetRequested ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
                If an account exists for this email, password reset instructions will be sent shortly.
              </div>
            ) : null}

            <button type="submit" className="btn-primary w-full py-3 text-sm">
              {pageContent.submitLabel}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-600">
            {pageContent.footerPrompt}{" "}
            <Link className="font-semibold text-slate-950" to={pageContent.footerHref}>
              {pageContent.footerAction}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

function getAuthPageContent(mode: AuthPageProps["mode"]) {
  if (mode === "signup") {
    return {
      eyebrow: "Create workspace",
      heroTitle: "Start managing bookings with less noise.",
      heroBody: "AI-Booking keeps appointment requests, resource availability and conflict checks in one simple place.",
      formEyebrow: "Sign up",
      formTitle: "Create your account",
      formBody: "Use your email and password to create a workspace.",
      submitLabel: "Create account",
      footerPrompt: "Already have an account?",
      footerAction: "Sign in",
      footerHref: "/signin"
    };
  }

  if (mode === "forgot") {
    return {
      eyebrow: "Account recovery",
      heroTitle: "Reset access without interrupting your booking day.",
      heroBody: "Enter the email linked to your AI-Booking account and continue with a secure password reset flow.",
      formEyebrow: "Forgot password",
      formTitle: "Reset your password",
      formBody: "Enter your account email and we will prepare reset instructions for you.",
      submitLabel: "Send reset instructions",
      footerPrompt: "Remembered your password?",
      footerAction: "Sign in",
      footerHref: "/signin"
    };
  }

  return {
    eyebrow: "Welcome back",
    heroTitle: "Return to your booking command center.",
    heroBody: "AI-Booking keeps appointment requests, resource availability and conflict checks in one simple place.",
    formEyebrow: "Sign in",
    formTitle: "Access your account",
    formBody: "Use your email and password to continue.",
    submitLabel: "Sign in",
    footerPrompt: "No account yet?",
    footerAction: "Create one",
    footerHref: "/signup"
  };
}
