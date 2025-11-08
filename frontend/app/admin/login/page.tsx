'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Store admin key in localStorage for API calls
    localStorage.setItem('adminKey', adminKey);
    
    const result = await signIn('credentials', {
      adminKey,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid admin key');
      localStorage.removeItem('adminKey');
      setLoading(false);
    } else {
      router.push('/admin');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="adminKey" className="block text-sm font-medium mb-2">
              Admin Key
            </label>
            <input
              type="password"
              id="adminKey"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900"
              placeholder="Enter admin key"
            />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 text-white py-2 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-blue-900">
            Return to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}

