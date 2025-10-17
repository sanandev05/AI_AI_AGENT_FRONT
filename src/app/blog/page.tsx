import React from 'react'
import Link from 'next/link'

export default function BlogPage(){
  const posts = [
    {
      title: "Building AI-powered workflows",
      excerpt: "How modern teams are using AI to automate complex business processes.",
      date: "Aug 20, 2025",
      author: "Manus Team",
      category: "Product"
    },
    {
      title: "The future of collaborative AI",
      excerpt: "Exploring how AI assistants will reshape how teams work together.",
      date: "Aug 15, 2025",
      author: "Manus Team",
      category: "Research"
    },
    {
      title: "From prototype to production",
      excerpt: "Best practices for scaling AI solutions in enterprise environments.",
      date: "Aug 10, 2025",
      author: "Manus Team",
      category: "Engineering"
    }
  ]

  return (
    <div className="min-h-screen bg-[var(--background-main)] text-white">
      {/* Header */}
      <div className="border-b border-[var(--border-main)]">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link href="/home" className="text-[var(--text-blue)] hover:underline text-sm">← Back to home</Link>
        </div>
      </div>

      {/* Blog Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 gradient-text">Manus Blog</h1>
          <p className="text-xl text-[var(--text-tertiary)] max-w-2xl">Insights, updates, and thoughts on the future of AI-powered productivity.</p>
        </div>

        <div className="space-y-8">
          {posts.map((post, index) => (
            <article key={index} className="glass-panel p-8 hover-glow rounded-xl transition-all duration-300 hover:transform hover:scale-[1.02]">
              <div className="mb-4">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[var(--highlight-blue)] text-white">
                  {post.category}
                </span>
              </div>
              
              <h2 className="text-2xl font-bold mb-3 hover:text-[var(--highlight-blue)] transition-colors cursor-pointer">
                {post.title}
              </h2>
              
              <p className="text-[var(--text-secondary)] mb-6 leading-relaxed">
                {post.excerpt}
              </p>
              
              <div className="flex items-center justify-between text-sm text-[var(--text-tertiary)]">
                <div className="flex items-center gap-4">
                  <span>{post.author}</span>
                  <span>•</span>
                  <span>{post.date}</span>
                </div>
                <button className="text-[var(--text-blue)] hover:underline">
                  Read more →
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Newsletter signup */}
        <div className="mt-16 glass-panel p-8 text-center rounded-xl">
          <h3 className="text-2xl font-bold mb-4">Stay updated</h3>
          <p className="text-[var(--text-tertiary)] mb-6">Get the latest posts and product updates delivered to your inbox.</p>
          <form onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.target as HTMLFormElement)
            const email = formData.get('email') as string
            if (email) {
              alert('Thanks for subscribing! (This is a demo)')
              ;(e.target as HTMLFormElement).reset()
            }
          }} className="max-w-md mx-auto flex gap-3">
            <input 
              type="email" 
              name="email"
              placeholder="Enter your email"
              required
              className="flex-1 px-4 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border-main)] focus:border-[var(--highlight-blue)] focus:outline-none text-white"
            />
            <button 
              type="submit"
              className="px-6 py-2 bg-[var(--highlight-blue)] hover:bg-[var(--highlight-purple)] transition-colors rounded-lg font-medium"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
