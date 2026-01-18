'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-white to-gray-50 flex flex-col">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-sky-100/40 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-amber-100/30 rounded-full blur-3xl"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 relative z-10">
        {/* Logo */}
        <div className="mb-6 sm:mb-8 animate-fade-in-up">
          <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 relative mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-3xl blur-xl"></div>
            <div className="relative w-full h-full rounded-3xl overflow-hidden border-4 border-white shadow-2xl">
              <Image
                src="/Agrisight-logo.jpg"
                alt="AgriSight Logo"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-3 sm:mb-4 tracking-tight animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          Agri<span className="text-emerald-600">Sight</span>
        </h1>

        {/* Tagline */}
        <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-10 sm:mb-12 text-center max-w-md px-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          AI-Powered Smart Farm Management for Modern Agriculture
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-sm sm:max-w-md px-4 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <Link
            href="/setup"
            className="flex-1 group relative overflow-hidden bg-gray-900 text-white px-6 sm:px-8 py-4 sm:py-5 rounded-2xl font-semibold text-center transition-all duration-300 hover:bg-gray-800 hover:shadow-xl hover:shadow-gray-900/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Get Started
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>

          <Link
            href="/about"
            className="flex-1 group bg-white text-gray-900 px-6 sm:px-8 py-4 sm:py-5 rounded-2xl font-semibold text-center border-2 border-gray-200 transition-all duration-300 hover:border-gray-300 hover:bg-gray-50 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              About
            </span>
          </Link>
        </div>

      </div>

      {/* Footer */}
      <footer className="py-4 sm:py-6 text-center text-xs sm:text-sm text-gray-500 relative z-10">
        <p>© 2021 AgriSight. Empowering farmers with technology.</p>
      </footer>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
