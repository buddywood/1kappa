import Link from 'next/link';

export default function CancelPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
        <div className="text-red-600 text-6xl mb-4">✗</div>
        <h1 className="text-2xl font-bold mb-4">Payment Cancelled</h1>
        <p className="text-gray-600 mb-6">
          Your payment was cancelled. No charges were made.
        </p>
        <Link
          href="/"
          className="inline-block bg-blue-900 text-white px-6 py-2 rounded-lg hover:bg-blue-800"
        >
          Return to Homepage
        </Link>
      </div>
    </main>
  );
}

