'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

export default function UpdatesPage() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'features' | 'improvements' | 'fixes' | 'announcements'>('all')

  // Set page title
  useEffect(() => {
    document.title = 'Updates & Release Notes - Manus AI'
  }, [])

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'features', name: 'Features' },
    { id: 'improvements', name: 'Improvements' },
    { id: 'fixes', name: 'Fixes' },
    { id: 'announcements', name: 'Announcements' }
  ]

  const updates = [
    {
      id: 1,
      title: 'Voice Recognition & Enhanced Search',
      description: 'Added voice input functionality and improved search capabilities with URL parameter passing for seamless navigation.',
      date: 'August 26, 2025',
      version: 'v2.1.0',
      type: 'features'
    },
    {
      id: 2,
      title: 'Modern Pricing & Events Pages',
      description: 'Complete redesign of pricing and events pages with professional layouts and interactive elements.',
      date: 'August 25, 2025',
      version: 'v2.0.5',
      type: 'features'
    },
    {
      id: 3,
      title: 'Homepage UI Overhaul',
      description: 'Major visual refresh with modern design, glass morphism effects, and enhanced animations.',
      date: 'August 24, 2025',
      version: 'v2.0.0',
      type: 'improvements'
    },
    {
      id: 4,
      title: 'Authentication & Social Login',
      description: 'Enhanced authentication system with social login options and improved security features.',
      date: 'August 22, 2025',
      version: 'v1.9.2',
      type: 'features'
    },
    {
      id: 5,
      title: 'Chat Interface Improvements',
      description: 'Enhanced chat workspace with URL parameter support and auto-send functionality.',
      date: 'August 20, 2025',
      version: 'v1.9.0',
      type: 'improvements'
    },
    {
      id: 6,
      title: 'Fixed Text Visibility Issues',
      description: 'Resolved text color issues in search inputs and improved overall text contrast.',
      date: 'August 18, 2025',
      version: 'v2.1.1',
      type: 'fixes'
    },
    {
      id: 7,
      title: 'Performance Optimizations',
      description: 'Various performance improvements and code optimizations across the application.',
      date: 'August 15, 2025',
      version: 'v1.8.0',
      type: 'improvements'
    },
    {
      id: 8,
      title: 'Mobile Responsiveness Updates',
      description: 'Enhanced mobile experience with improved navigation and touch interactions.',
      date: 'August 12, 2025',
      version: 'v1.7.5',
      type: 'improvements'
    }
  ]

  const filteredUpdates = selectedCategory === 'all' 
    ? updates 
    : updates.filter(update => update.type === selectedCategory)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="w-full max-w-4xl mx-auto h-16 px-6 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-semibold text-xl text-gray-900">Manus</span>
          </Link>
          <Link href="/home" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
            ← Back to Home
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Updates</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Stay up to date with new features, improvements, and bug fixes.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex justify-center gap-2 mb-8">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id as any)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedCategory === category.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Updates List */}
        <div className="space-y-8">
          {filteredUpdates.map((update) => (
            <article key={update.id} className="border-b border-gray-200 pb-8 last:border-b-0">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    update.type === 'features' ? 'bg-blue-100 text-blue-700' :
                    update.type === 'improvements' ? 'bg-green-100 text-green-700' :
                    update.type === 'fixes' ? 'bg-red-100 text-red-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {update.type}
                  </span>
                  <span className="text-sm text-gray-500">{update.version}</span>
                </div>
                <span className="text-sm text-gray-500">{update.date}</span>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {update.title}
              </h2>
              
              <p className="text-gray-600 leading-relaxed">
                {update.description}
              </p>
            </article>
          ))}
        </div>

        {/* Newsletter */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Stay updated
            </h3>
            <p className="text-gray-600 mb-6">
              Get notified when we ship new features and improvements.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
