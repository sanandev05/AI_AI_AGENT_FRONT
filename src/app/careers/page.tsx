import React from 'react'
import Link from 'next/link'

export default function CareersPage(){
  const positions = [
    {
      title: "Senior Frontend Engineer",
      department: "Engineering",
      location: "Remote / San Francisco",
      type: "Full-time",
      description: "Build the future of AI-powered productivity tools with React, TypeScript, and modern web technologies."
    },
    {
      title: "AI Research Scientist",
      department: "Research",
      location: "Remote / New York",
      type: "Full-time", 
      description: "Develop cutting-edge AI models and algorithms to power next-generation intelligent workflows."
    },
    {
      title: "Product Designer",
      department: "Design",
      location: "Remote",
      type: "Full-time",
      description: "Shape the user experience of AI tools that millions will use to transform how they work."
    },
    {
      title: "Developer Relations",
      department: "Community",
      location: "Remote",
      type: "Full-time",
      description: "Build and nurture our developer community, create content, and represent Manus at conferences."
    }
  ]

  const benefits = [
    "💰 Competitive salary + equity",
    "🏥 Health, dental & vision insurance", 
    "🏖️ Unlimited PTO",
    "💻 Latest tech & equipment",
    "🌍 Remote-first culture",
    "📚 Learning & development budget"
  ]

  return (
    <div className="min-h-screen bg-[var(--background-main)] text-white">
      {/* Header */}
      <div className="border-b border-[var(--border-main)]">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <Link href="/home" className="text-[var(--text-blue)] hover:underline text-sm">← Back to home</Link>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h1 className="text-6xl font-bold mb-6">
          Join the <span className="gradient-text">future</span> of work
        </h1>
        <p className="text-xl text-[var(--text-tertiary)] max-w-2xl mx-auto mb-8">
          Help us build AI tools that empower teams to accomplish more than they ever thought possible.
        </p>
      </div>

      {/* Values */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Manus?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: "🚀",
              title: "Ship fast",
              description: "Move quickly from idea to production with minimal bureaucracy."
            },
            {
              icon: "🧠", 
              title: "Think big",
              description: "Work on problems that will reshape how millions of people work."
            },
            {
              icon: "🤝",
              title: "Grow together", 
              description: "Learn from brilliant colleagues in a supportive, collaborative environment."
            }
          ].map((value, index) => (
            <div key={index} className="glass-panel p-8 text-center rounded-xl hover-glow transition-all duration-300">
              <div className="text-4xl mb-4">{value.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
              <p className="text-[var(--text-tertiary)]">{value.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Open Positions */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold mb-12">Open Positions</h2>
        <div className="space-y-6">
          {positions.map((position, index) => (
            <div key={index} className="glass-panel p-8 rounded-xl hover-glow transition-all duration-300 hover:transform hover:scale-[1.01]">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{position.title}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-[var(--highlight-blue)] text-white">
                      {position.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[var(--text-tertiary)] mb-3">
                    <span>{position.department}</span>
                    <span>•</span>
                    <span>{position.location}</span>
                  </div>
                  <p className="text-[var(--text-secondary)]">{position.description}</p>
                </div>
                <button 
                  onClick={() => {
                    // In a real app, this would open an application form or redirect to a job portal
                    alert(`Application for ${position.title} is now open! (This is a demo)`)
                  }}
                  className="px-6 py-2 bg-[var(--highlight-blue)] hover:bg-[var(--highlight-purple)] transition-colors rounded-lg font-medium lg:ml-6"
                >
                  Apply Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Benefits & Perks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {benefits.map((benefit, index) => (
            <div key={index} className="glass-panel p-6 rounded-xl text-center hover-glow transition-all duration-300">
              <span className="text-lg">{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="glass-panel p-12 rounded-xl">
          <h2 className="text-3xl font-bold mb-4">Don&apos;t see the right fit?</h2>
          <p className="text-[var(--text-tertiary)] mb-8">
            We&apos;re always looking for talented people. Send us your resume and let us know what excites you.
          </p>
          <button 
            onClick={() => {
              alert('General inquiry form will open! (This is a demo)')
            }}
            className="px-8 py-3 bg-[var(--highlight-blue)] hover:bg-[var(--highlight-purple)] transition-colors rounded-lg font-medium text-lg"
          >
            Get in Touch
          </button>
        </div>
      </div>
    </div>
  )
}
