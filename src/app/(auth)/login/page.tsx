import { LoginForm } from "./login-form";

export const metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-5xl">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center rounded-full border border-blue-300/20 bg-blue-300/10 px-3 py-1 text-xs font-medium text-blue-100">Loubinette IDP Control Center</div>
          <h2 className="max-w-2xl text-4xl font-semibold tracking-tight text-white">A private operating center for every IDP brand.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">This app is intentionally noindex and protected. Authorization is enforced server-side after Supabase Auth.</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
