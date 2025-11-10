import Link from 'next/link';
import Logo from '../components/Logo';

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-cream flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md border border-frost-gray">
        <div className="mb-4">
          <Logo />
        </div>
        <div className="text-green-600 text-6xl mb-4">✓</div>
        <h1 className="text-2xl font-display font-bold text-midnight-navy mb-4">Payment Successful!</h1>
        <p className="text-midnight-navy/70 mb-6">
          Thank you for your purchase. You will receive a confirmation email shortly.
        </p>
        <Link
          href="/"
          className="inline-block bg-crimson text-white px-6 py-2 rounded-lg hover:bg-crimson/90 transition shadow-md hover:shadow-lg"
        >
          Return to Homepage
        </Link>
      </div>
    </main>
  );
}

