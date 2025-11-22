import Link from 'next/link';
import Header from './components/Header';
import Footer from './components/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream text-midnight-navy flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Fun 404 Illustration */}
          <div className="mb-8 relative">
            <div className="text-9xl font-display font-bold text-crimson/20 select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl animate-bounce">🔍</div>
            </div>
          </div>

          {/* Main Message */}
          <h1 className="text-4xl md:text-5xl font-display font-bold text-midnight-navy mb-4">
            Oops! Page Not Found
          </h1>
          
          <p className="text-xl text-midnight-navy/70 mb-8">
            Looks like this page took a wrong turn on the journey to excellence.
          </p>

          {/* Fun Illustration */}
          <div className="mb-12 flex justify-center">
            <div className="relative w-64 h-64">
              <div className="absolute inset-0 bg-gradient-to-br from-crimson/10 to-midnight-navy/10 rounded-full blur-3xl"></div>
              <div className="relative bg-white rounded-full p-8 shadow-lg border-4 border-crimson/20">
                <svg 
                  className="w-full h-full text-crimson" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Helpful Links */}
          <div className="space-y-4 mb-8">
            <p className="text-midnight-navy/60 mb-6">
              Don&apos;t worry, brother! Here are some places you might want to visit:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/"
                className="group bg-white border-2 border-crimson/30 rounded-xl p-6 hover:border-crimson hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-6 h-6 text-crimson" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <h3 className="font-semibold text-midnight-navy group-hover:text-crimson transition">
                    Home
                  </h3>
                </div>
                <p className="text-sm text-midnight-navy/60">
                  Return to the main page
                </p>
              </Link>

              <Link
                href="/collections"
                className="group bg-white border-2 border-crimson/30 rounded-xl p-6 hover:border-crimson hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-6 h-6 text-crimson" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <h3 className="font-semibold text-midnight-navy group-hover:text-crimson transition">
                    Collections
                  </h3>
                </div>
                <p className="text-sm text-midnight-navy/60">
                  Browse brotherhood collections
                </p>
              </Link>

              <Link
                href="/shop"
                className="group bg-white border-2 border-crimson/30 rounded-xl p-6 hover:border-crimson hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-6 h-6 text-crimson" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <h3 className="font-semibold text-midnight-navy group-hover:text-crimson transition">
                    Shop
                  </h3>
                </div>
                <p className="text-sm text-midnight-navy/60">
                  Explore our marketplace
                </p>
              </Link>

              <Link
                href="/events"
                className="group bg-white border-2 border-crimson/30 rounded-xl p-6 hover:border-crimson hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-6 h-6 text-crimson" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="font-semibold text-midnight-navy group-hover:text-crimson transition">
                    Events
                  </h3>
                </div>
                <p className="text-sm text-midnight-navy/60">
                  Check out upcoming events
                </p>
              </Link>
            </div>
          </div>

          {/* Fun Quote */}
          <div className="mt-12 p-6 bg-gradient-to-r from-crimson/5 to-midnight-navy/5 rounded-xl border-l-4 border-crimson">
            <p className="text-midnight-navy/80 italic">
              &quot;Achievement in every field of human endeavor&quot;
            </p>
            <p className="text-sm text-midnight-navy/60 mt-2">
              — Even when navigating the web, we strive for excellence
            </p>
          </div>

          {/* Back Button */}
          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-crimson text-white px-8 py-3 rounded-full font-semibold hover:bg-crimson/90 transition shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Go Back Home
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

