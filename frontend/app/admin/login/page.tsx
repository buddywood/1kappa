'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '../../components/Logo';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
        setLoading(false);
      } else if (result?.ok) {
        // Wait a moment for session to update, then check role
        setTimeout(async () => {
          try {
            const session = await fetch('/api/auth/session').then(res => res.json());
            if (session?.user?.role === 'ADMIN') {
              router.push('/admin');
              router.refresh();
            } else {
              setError('Admin access required. Please contact an administrator.');
              setLoading(false);
            }
          } catch (err) {
            console.error('Error checking session:', err);
            setError('Failed to verify admin access');
            setLoading(false);
          }
        }, 500);
      } else {
        setError('Login failed');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full border border-frost-gray">
        <div className="mb-6 text-center">
          <Logo />
        </div>
        <h1 className="text-2xl font-display font-bold mb-6 text-center text-midnight-navy">Admin Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2 text-midnight-navy">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2 text-midnight-navy">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
              placeholder="Enter your password"
            />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-crimson text-white py-2 rounded-lg font-semibold hover:bg-crimson/90 transition disabled:opacity-50 shadow-md hover:shadow-lg"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-midnight-navy/70 hover:text-crimson transition">
            Return to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}

