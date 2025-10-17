'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

export default function EventsPage() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'webinar' | 'workshop' | 'conference' | 'meetup'>('all')
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null)

  // Set page title
  useEffect(() => {
    document.title = 'Events - Manus AI Assistant'
  }, [])

  const categories = [
    { id: 'all', name: 'All Events', count: 12 },
    { id: 'webinar', name: 'Webinars', count: 5 },
    { id: 'workshop', name: 'Workshops', count: 3 },
    { id: 'conference', name: 'Conferences', count: 2 },
    { id: 'meetup', name: 'Meetups', count: 2 }
  ]

  const events = [
    {
      id: 1,
      title: 'The Future of AI in Content Creation',
      description: 'Join leading experts as they discuss how AI is revolutionizing content creation across industries.',
      date: 'March 15, 2025',
      time: '2:00 PM EST',
      type: 'webinar',
      duration: '1 hour',
      attendees: 1250,
      image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&h=240&fit=crop',
      speakers: ['Dr. Sarah Chen', 'Mike Rodriguez'],
      tags: ['AI', 'Content', 'Automation'],
      featured: true,
      status: 'upcoming'
    },
    {
      id: 2,
      title: 'Hands-on AI Workshop: Building Your First Chatbot',
      description: 'Learn to build and deploy your own AI chatbot with practical exercises and real-world examples.',
      date: 'March 22, 2025',
      time: '10:00 AM EST',
      type: 'workshop',
      duration: '3 hours',
      attendees: 45,
      image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=240&fit=crop',
      speakers: ['Alex Johnson', 'Lisa Wang'],
      tags: ['Workshop', 'Chatbot', 'Hands-on'],
      featured: false,
      status: 'upcoming'
    },
    {
      id: 3,
      title: 'AI Ethics and Responsibility Summit',
      description: 'A comprehensive discussion on responsible AI development and ethical considerations.',
      date: 'April 5, 2025',
      time: '9:00 AM EST',
      type: 'conference',
      duration: '8 hours',
      attendees: 2500,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=240&fit=crop',
      speakers: ['Prof. David Kim', 'Elena Martinez', 'Dr. James Wilson'],
      tags: ['Ethics', 'AI Safety', 'Policy'],
      featured: true,
      status: 'upcoming'
    },
    {
      id: 4,
      title: 'Local AI Meetup: San Francisco',
      description: 'Connect with fellow AI enthusiasts and professionals in the San Francisco Bay Area.',
      date: 'March 28, 2025',
      time: '6:00 PM PST',
      type: 'meetup',
      duration: '3 hours',
      attendees: 85,
      image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=240&fit=crop',
      speakers: ['Community Leaders'],
      tags: ['Networking', 'Local', 'San Francisco'],
      featured: false,
      status: 'upcoming'
    },
    {
      id: 5,
      title: 'AI in Business: ROI and Implementation',
      description: 'Learn how to successfully implement AI solutions in your business and measure ROI.',
      date: 'April 12, 2025',
      time: '3:00 PM EST',
      type: 'webinar',
      duration: '90 minutes',
      attendees: 890,
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=240&fit=crop',
      speakers: ['Rachel Thompson', 'Mark Stevens'],
      tags: ['Business', 'ROI', 'Implementation'],
      featured: false,
      status: 'upcoming'
    },
    {
      id: 6,
      title: 'Introduction to Machine Learning',
      description: 'Perfect for beginners - learn the fundamentals of machine learning and its applications.',
      date: 'February 28, 2025',
      time: '1:00 PM EST',
      type: 'webinar',
      duration: '1 hour',
      attendees: 2100,
      image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=240&fit=crop',
      speakers: ['Dr. Amanda Foster'],
      tags: ['Beginner', 'ML', 'Fundamentals'],
      featured: false,
      status: 'past'
    }
  ]

  const filteredEvents = selectedCategory === 'all' 
    ? events 
    : events.filter(event => event.type === selectedCategory)

  const upcomingEvents = filteredEvents.filter(event => event.status === 'upcoming')
  const pastEvents = filteredEvents.filter(event => event.status === 'past')

  const handleRegister = (eventId: number) => {
    // Handle event registration
    alert(`Registration for event ${eventId} would be handled here!`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200/50 bg-white/80 backdrop-blur-xl">
        <div className="w-full max-w-7xl mx-auto h-16 px-6 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Manus
            </span>
          </Link>
          <Link href="/home" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-40 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-60 right-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-1/3 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-2000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
              AI Events &
            </span>
            <br />
            <span className="bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent">
              Community
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Join thousands of AI enthusiasts, developers, and business leaders in our 
            community events. Learn, network, and stay ahead of the AI revolution.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id as any)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-orange-500 to-pink-600 text-white shadow-lg scale-105'
                  : 'bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 hover:border-orange-300 hover:shadow-md hover:scale-105'
              }`}
            >
              {category.name}
              <span className="ml-2 text-xs opacity-70">({category.count})</span>
            </button>
          ))}
        </div>

        {/* Upcoming Events */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Upcoming Events
              <span className="ml-3 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                {upcomingEvents.length} events
              </span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className={`group relative bg-white/80 backdrop-blur-sm border border-gray-200 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden ${
                  event.featured ? 'ring-2 ring-orange-200 shadow-orange-100/50' : ''
                } ${
                  hoveredEvent === event.id.toString() ? 'scale-[1.02] -translate-y-2' : ''
                }`}
                onMouseEnter={() => setHoveredEvent(event.id.toString())}
                onMouseLeave={() => setHoveredEvent(null)}
              >
                {event.featured && (
                  <div className="absolute top-4 left-4 z-10">
                    <span className="bg-gradient-to-r from-orange-500 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                      Featured
                    </span>
                  </div>
                )}

                <div className="relative h-48 overflow-hidden">
                  <div 
                    className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url(${event.image})` }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                      event.type === 'webinar' ? 'bg-blue-500' :
                      event.type === 'workshop' ? 'bg-green-500' :
                      event.type === 'conference' ? 'bg-purple-500' :
                      'bg-orange-500'
                    }`}>
                      {event.type.toUpperCase()}
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <span>{event.time}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {event.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {event.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <span>Duration: {event.duration}</span>
                        <span>{event.attendees} registered</span>
                      </div>
                      <div className="mt-1">
                        Speakers: {event.speakers.join(', ')}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRegister(event.id)}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-pink-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Register Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                Past Events
                <span className="ml-3 px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                  {pastEvents.length} events
                </span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 opacity-75"
                >
                  <div className="mb-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      {event.type.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {event.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {event.date} • {event.attendees} attended
                  </p>
                  <button className="text-orange-600 hover:text-orange-700 font-medium text-sm transition-colors">
                    View Recording →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-purple-500/10 rounded-3xl"></div>
          
          <div className="relative text-center bg-white/50 backdrop-blur-sm rounded-3xl p-12 border border-gray-200 shadow-xl">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Want to host an event?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Join our community of event organizers and share your knowledge with 
                fellow AI enthusiasts worldwide.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact?type=event" className="group relative px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <span className="relative">Propose Event</span>
                </Link>
                <Link href="/community" className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-full font-semibold text-lg hover:border-orange-400 hover:text-orange-600 transition-all duration-300 hover:scale-105 bg-white/70 backdrop-blur-sm">
                  Join Community
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
