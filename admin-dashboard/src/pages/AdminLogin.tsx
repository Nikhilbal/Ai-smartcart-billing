import { LockKeyhole, Mail, ShoppingCart } from "lucide-react";
import { FormEvent, useState } from "react";
import { Button, Card, Input } from "../components/ui";

type Props = {
  onLogin: () => void;
};

export function AdminLogin({ onLogin }: Props) {
  const [email, setEmail] = useState("admin@smartcart.local");
  const [password, setPassword] = useState("admin123");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (email && password) onLogin();
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
          <Button className="h-13 w-full bg-brand py-4 text-base text-white shadow-soft">Login</Button>
        </form>
      </Card>
    </main>
  );
}
