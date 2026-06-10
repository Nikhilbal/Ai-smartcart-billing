import { LockKeyhole, Mail, ShoppingCart } from "lucide-react";
import { FormEvent, useState } from "react";
import { Button, Card, Input } from "../components/ui";
import { api } from "../lib/api";

type Props = {
  onLogin: (token?: string) => void;
};

export function AdminLogin({ onLogin }: Props) {
  const [email, setEmail] = useState("admin@smartcart.local");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!email || !password || loading) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/admin-login", { email, password });
      const token = data.data.token as string;
      window.localStorage.setItem("smart-cart.adminToken", token);
      onLogin(token);
    } catch {
      window.localStorage.removeItem("smart-cart.adminToken");
      setError("Backend login unavailable. Opening dashboard in offline inventory demo mode.");
      window.setTimeout(() => onLogin(), 500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-page p-6">
      <Card className="w-full max-w-md overflow-hidden">
        <div className="bg-brand p-9 text-center text-white">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-white/15">
            <ShoppingCart size={34} />
          </div>
          <h1 className="mt-5 text-3xl font-extrabold">Smart Cart Admin</h1>
          <p className="mt-2 font-semibold text-blue-100">Smart Supermarket · Mumbai</p>
        </div>
        <form onSubmit={submit} className="space-y-5 p-7">
          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-gray-700">Email</span>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input className="pl-12" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-gray-700">Password</span>
            <div className="relative">
              <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input className="pl-12" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </div>
          </label>
          {error ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">{error}</div> : null}
          <Button className="h-13 w-full bg-brand py-4 text-base text-white shadow-soft" disabled={loading}>{loading ? "Checking..." : "Login"}</Button>
        </form>
      </Card>
    </main>
  );
}
