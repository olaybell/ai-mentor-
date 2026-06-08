import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Brand } from "../components/Brand";
import { loginRequest, registerRequest } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import type { AuthCredentials, AuthResponse, RegisterRequest } from "../types/auth";

type AuthPageProps = {
  mode: "signin" | "signup" | "forgot";
};

export function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [fullName, setFullName] = useState("");
  const [accountType, setAccountType] = useState<"customer" | "business">("customer");
  const [resetRequested, setResetRequested] = useState(false);
  const isSignup = mode === "signup";
  const isForgotPassword = mode === "forgot";
  const [authError, setAuthError] = useState("");

  const loginMutation = useMutation({
    mutationFn: (credentials: AuthCredentials) => loginRequest(credentials),
    onSuccess: (data) => {
      setSession(data);
      navigate(getPostAuthPath(data), { replace: true });
    },
    onError: (error) => {
      setAuthError(error instanceof Error ? error.message : "Unable to sign in right now.");
    }
  });

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterRequest) => registerRequest(payload),
    onSuccess: (data) => {
      setSession(data);
      navigate(getPostAuthPath(data), { replace: true });
    },
    onError: (error) => {
      setAuthError(error instanceof Error ? error.message : "Unable to create the account.");
    }
  });

  const pageContent = getAuthPageContent(mode);
  const isSubmitting = loginMutation.isPending || registerMutation.isPending;

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
              setAuthError("");

              if (isForgotPassword) {
                setResetRequested(true);
                return;
              }

              if (isSignup) {
                registerMutation.mutate({
                  email,
                  password,
                  role: accountType === "business" ? "admin" : "customer",
                  businessName: accountType === "business" ? businessName : undefined,
                  fullName: accountType === "customer" ? fullName : undefined,
                });
                return;
              }

              loginMutation.mutate({ email, password });
            }}
          >
            {isSignup ? (
              <div className="space-y-5">
                <div>
                  <span className="text-sm font-semibold text-slate-800">Account type</span>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      aria-pressed={accountType === "customer"}
                      className={`min-h-11 rounded-lg border px-4 text-sm font-semibold transition ${
                        accountType === "customer"
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                      }`}
                      onClick={() => setAccountType("customer")}
                    >
                      Customer
                    </button>
                    <button
                      type="button"
                      aria-pressed={accountType === "business"}
                      className={`min-h-11 rounded-lg border px-4 text-sm font-semibold transition ${
                        accountType === "business"
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                      }`}
                      onClick={() => setAccountType("business")}
                    >
                      Business
                    </button>
                  </div>
                </div>

                {accountType === "business" ? (
                  <label className="form-field">
                    <span>Business name</span>
                    <input
                      type="text"
                      placeholder="Bright Studio"
                      autoComplete="organization"
                      value={businessName}
                      onChange={(event) => setBusinessName(event.target.value)}
                      required
                    />
                  </label>
                ) : (
                  <label className="form-field">
                    <span>Full name</span>
                    <input
                      type="text"
                      placeholder="Your name"
                      autoComplete="name"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      required
                    />
                  </label>
                )}
              </div>
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

            {authError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800">
                {authError}
              </div>
            ) : null}

            <button type="submit" className="btn-primary w-full py-3 text-sm" disabled={isSubmitting}>
              {isSubmitting ? "Please wait..." : pageContent.submitLabel}
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
      eyebrow: "Create account",
      heroTitle: "Book or manage appointments from one place.",
      heroBody: "Create a customer account to track appointments, or create a business account to publish booking pages and manage schedules.",
      formEyebrow: "Sign up",
      formTitle: "Create your account",
      formBody: "Choose whether this account is for booking appointments or managing a business.",
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

function getPostAuthPath(session: AuthResponse) {
  return session.user.role === "customer" ? "/customer/dashboard" : "/dashboard";
}
