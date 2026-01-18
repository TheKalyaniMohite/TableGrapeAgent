'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function AboutPage() {
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

  const technologies = [
    {
      category: 'Frontend',
      icon: '',
      items: [
        { name: 'Next.js 14', desc: 'React framework with App Router' },
        { name: 'TypeScript', desc: 'Type-safe JavaScript' },
        { name: 'Tailwind CSS', desc: 'Utility-first CSS framework' },
        { name: 'React Hooks', desc: 'State management & effects' },
      ],
    },
    {
      category: 'Backend',
      icon: '',
      items: [
        { name: 'FastAPI', desc: 'Modern Python web framework' },
        { name: 'SQLAlchemy', desc: 'SQL toolkit and ORM' },
        { name: 'SQLite', desc: 'Lightweight database' },
        { name: 'Uvicorn', desc: 'ASGI server' },
      ],
    },
    {
      category: 'AI & APIs',
      icon: '',
      items: [
        { name: 'OpenAI GPT', desc: 'AI-powered recommendations' },
        { name: 'Google Weather API', desc: 'Weather forecasting' },
        { name: 'Open-Meteo', desc: 'Fallback weather data' },
        { name: 'Geocoding API', desc: 'Location services' },
      ],
    },
    {
      category: 'Features',
      icon: '',
      items: [
        { name: 'Multi-language', desc: '10+ languages supported' },
        { name: 'Responsive Design', desc: 'Mobile-first approach' },
        { name: 'Real-time Chat', desc: 'AI farming assistant' },
        { name: 'Image Analysis', desc: 'Crop health scanning' },
      ],
    },
  ];

  const features = [
    {
      title: 'Farm Setup & Management',
      description: 'Easy onboarding process to set up your farm with location detection, block management, and crop variety tracking.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Smart Dashboard',
      description: "Comprehensive overview of your farm's status, daily tasks, weather forecasts, and AI-powered recommendations all in one place.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      title: 'AI Chat Assistant',
      description: 'Interactive chatbot that answers farming questions, provides pest management advice, and helps with crop-specific recommendations.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      title: 'Crop Health Scanner',
      description: 'Upload photos of your crops to get AI-powered analysis of plant health, disease detection, and recommended actions.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      title: 'Weather Integration',
      description: '7-day weather forecasts with precipitation, temperature trends, and weather-based farming recommendations.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      ),
    },
    {
      title: 'Daily Check-ins',
      description: 'Track crop growth stages, irrigation schedules, spray applications, and identify issues like cracking, sunburn, or pest signs.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20 sm:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link href="/" className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 relative rounded-lg overflow-hidden">
                <Image
                  src="/Agrisight-logo.jpg"
                  alt="AgriSight"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="font-bold text-lg sm:text-xl text-gray-900">Agri<span className="text-emerald-600">Sight</span></span>
            </Link>
            <Link
              href="/setup"
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-900 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs sm:text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            AI-Powered Agriculture
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 tracking-tight">
            About <span className="text-emerald-600">AgriSight</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            AgriSight is an intelligent farm management platform designed to help farmers make data-driven decisions 
            using AI technology, weather insights, and personalized recommendations.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 border border-gray-100 shadow-sm">
            <div className="flex items-start gap-4 sm:gap-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl sm:text-3xl"></span>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Our Mission</h2>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  To democratize access to advanced agricultural technology by providing farmers with an 
                  easy-to-use platform that combines artificial intelligence, real-time weather data, and 
                  expert farming knowledge. We believe every farmer, regardless of scale, deserves access 
                  to tools that can help optimize their yields and protect their crops.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">Key Features</h2>
            <p className="text-sm sm:text-base text-gray-600">Everything you need to manage your farm intelligently</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3 sm:mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">Technology Stack</h2>
            <p className="text-sm sm:text-base text-gray-600">Built with modern, reliable technologies</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {technologies.map((tech, index) => (
              <div
                key={index}
                className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl sm:text-3xl">{tech.icon}</span>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{tech.category}</h3>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {tech.items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
                      <div>
                        <span className="text-sm sm:text-base font-medium text-gray-900">{item.name}</span>
                        <span className="text-xs sm:text-sm text-gray-500 ml-2">— {item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Languages */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">Multi-Language Support</h2>
            <p className="text-sm sm:text-base text-gray-600">Available in 10+ languages to serve farmers worldwide</p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {[
              { code: '🇺🇸', name: 'English' },
              { code: '🇮🇳', name: 'हिंदी' },
              { code: '🇪🇸', name: 'Español' },
              { code: '🇮🇳', name: 'मराठी' },
              { code: '🇫🇷', name: 'Français' },
              { code: '🇩🇪', name: 'Deutsch' },
              { code: '🇵🇹', name: 'Português' },
              { code: '🇨🇳', name: '中文' },
              { code: '🇯🇵', name: '日本語' },
              { code: '🇸🇦', name: 'العربية' },
            ].map((lang, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white rounded-full border border-gray-200 text-xs sm:text-sm font-medium text-gray-700"
              >
                <span>{lang.code}</span>
                <span>{lang.name}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-2xl text-center">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl sm:rounded-3xl p-8 sm:p-10 md:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">Ready to Transform Your Farm?</h2>
            <p className="text-sm sm:text-base text-gray-300 mb-6 sm:mb-8">
              Join thousands of farmers using AgriSight to optimize their yields
            </p>
            <Link
              href="/setup"
              className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base hover:bg-gray-100 transition-colors"
            >
              Get Started Now
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
        <div className="container mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 relative rounded overflow-hidden">
              <Image
                src="/Agrisight-logo.jpg"
                alt="AgriSight"
                fill
                className="object-cover"
              />
            </div>
            <span className="text-sm font-semibold text-gray-900">Agri<span className="text-emerald-600">Sight</span></span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-right">
            © 2021 AgriSight. Empowering farmers with technology.
          </p>
        </div>
      </footer>
    </div>
  );
}

