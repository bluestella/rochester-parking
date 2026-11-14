'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlateTag } from '@/components/ds/plate-tag';
import { brand } from '@/lib/brand';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Signed in');
      router.push(callbackUrl);
      router.refresh();
    } catch {
      toast.error('An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
          required
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          required
          autoComplete="current-password"
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign in
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* The deck: brand panel drawn as a row of painted bays */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <p className="type-title text-2xl tracking-wide">{brand.name}</p>
        <div>
          <h1 className="type-display max-w-[14ch] text-5xl leading-[1.05]">One desk for the whole building.</h1>
          <p className="mt-4 max-w-[38ch] text-sidebar-muted">
            Parking, monthly dues, amenities, repairs and visitors, for the admin office, the guards and every resident.
          </p>
        </div>
        <div aria-hidden className="-mx-10 -mb-10 flex h-36 items-end gap-0 border-t-[3px] border-line/80 px-10">
          {['P1-01', 'P1-02', 'P1-03', 'P1-04', 'P1-05', 'P1-06'].map((code, i) => (
            <div key={code} className="flex h-28 flex-1 flex-col items-center justify-between border-l-[3px] border-line/80 pb-3 pt-4 last:border-r-[3px]">
              {i === 1 ? <PlateTag plate="NGA 4821" size="sm" /> : i === 4 ? <PlateTag plate="ABC 1234" size="sm" /> : <span />}
              <span className="type-stencil text-xs text-sidebar-muted">{code}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <p className="type-title mb-8 text-2xl tracking-wide text-primary lg:hidden">{brand.name}</p>
          <h2 className="type-display">Sign in</h2>
          <p className="mb-6 mt-1 text-muted-foreground">Use the account the admin office gave you.</p>
          <Suspense fallback={<div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
            <LoginForm />
          </Suspense>

          {process.env.NODE_ENV !== 'production' && (
            <div className="mt-8 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Demo accounts (development only)</p>
              <p>superadmin@parktrack.com / super123</p>
              <p>admin@parktrack.com / admin123</p>
              <p>accountant@parktrack.com / accountant123</p>
              <p>maintenance@parktrack.com / maintenance123</p>
              <p>guard@parktrack.com / guard123</p>
              <p>resident@parktrack.com / resident123</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
