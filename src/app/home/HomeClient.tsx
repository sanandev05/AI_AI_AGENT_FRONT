"use client"

import { useState } from "react"
import Link from "next/link"
import ProtectedLink from "../../components/ProtectedLink"
import Image from "next/image"

export default function HomeClient() {
  const [query, setQuery] = useState("")
  const [collapsed, setCollapsed] = useState(false)

  function Logo() {
    return (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white font-semibold">M</div>
        <div className="font-semibold text-sm">Manus</div>
      </div>
    )
  }

  function Header() {
    return (
      <header className="w-full max-w-[1048px] mx-auto h-[56px] py-3 px-6 grid grid-cols-2 md:grid-cols-[1fr_auto_1fr] items-center gap-4">
        <Link href="/home" className="flex items-center gap-3">
          <Logo />
        </Link>

        <nav className="hidden md:flex justify-center items-center gap-3 text-sm text-[var(--text-secondary)]">
          <a href="#pricing" className="px-3 py-1.5 rounded-[8px] hover:bg-[var(--fill-tsp-white-main)]">Pricing</a>
          <a href="/blog" className="px-3 py-1.5 rounded-[8px] hover:bg-[var(--fill-tsp-white-main)]">Blog</a>
          <a href="https://events.manus.im" rel="noreferrer" target="_blank" className="px-3 py-1.5 rounded-[8px] hover:bg-[var(--fill-tsp-white-main)]">Events</a>
          <a href="/updates" className="px-3 py-1.5 rounded-[8px] hover:bg-[var(--fill-tsp-white-main)]">Updates</a>
        </nav>

        <div className="flex justify-end items-center gap-4">
          <div className="hidden md:flex items-center gap-3">
            <ProtectedLink href="/profile" className="h-8 px-3 rounded-full bg-transparent border border-[var(--border-main)] text-[var(--text-primary)] flex items-center gap-2">Account</ProtectedLink>
          </div>
          <button onClick={() => setCollapsed(!collapsed)} className="md:hidden p-2 rounded-md glass-button">☰</button>
        </div>
      </header>
    )
  }

  function Hero() {
    return (
      <section className="w-full max-w-[1600px] mx-auto mt-6 px-4 md:px-6">
        <div className="grid lg:grid-cols-[1fr_minmax(800px,auto)_1fr] bg-[var(--background-gray-main)] rounded-[16px] overflow-hidden">
          <div />
          <div className="py-12 px-6 text-center">
            <div className="inline-block">
              <h1 className="text-5xl font-[700] leading-[58px] font-serif text-[var(--text-primary)]">The 24/7 AI that delivers <span className="text-[var(--text-blue)]">slides</span> for you.</h1>
            </div>

            <div className="mt-8 mx-auto max-w-[800px]">
              <div className="rounded-[22px] bg-[var(--fill-input-chat)] py-3 shadow-[0_16px_32px_rgba(0,0,0,0.05)] border border-black/10 relative">
                <div className="px-4">
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Research Einstein’s life and design an interactive website to showcase his story."
                    className="w-full bg-transparent resize-none placeholder:text-[var(--text-disable)] text-[15px] p-0 pt-[6px] min-h-[40px] h-[64px]"
                  />
                </div>
                <div className="absolute right-3 bottom-3 flex items-center gap-2">
                  <button className="w-9 h-9 rounded-full bg-[var(--fill-tsp-white-main)] text-[var(--text-primary)]">🎤</button>
                  <Link href="/chat" className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[var(--Button-primary-black)] text-[var(--text-onblack)]">➤</Link>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 justify-center">
              <Link href="/chat" className="h-[48px] inline-flex items-center justify-center px-6 rounded-[48px] bg-[var(--Button-primary-black)] text-[var(--text-onblack)] font-medium">Get started</Link>
              <Link href="/chat" className="h-[48px] inline-flex items-center justify-center px-6 rounded-[48px] border border-[var(--border-main)] text-[var(--text-primary)]">Open Workspace</Link>
            </div>
          </div>
          <div />
        </div>
      </section>
    )
  }

  function FeatureGrid() {
    const cards = [
      { title: "Wide Research", img: "https://files.manuscdn.com/webapp/_next/static/media/wide-research.d040f229.webp" },
      { title: "Create advertisement video", img: "https://files.manuscdn.com/webapp/_next/static/media/create-advertisement-video.59f76117.webp" },
      { title: "Plan hiking routes", img: "https://files.manuscdn.com/webapp/_next/static/media/plan-hiking-routes.7909a725.webp" },
    ]

    return (
      <section className="max-w-[1048px] mx-auto px-4 md:px-6 mt-12">
        <h2 className="text-3xl font-[700] text-[var(--text-primary)] text-center font-serif">From tedious to effortless.</h2>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {cards.map((c) => (
            <div key={c.title} className="group w-fit mx-auto">
              <div className="w-full aspect-[4/3] rounded-[16px] overflow-hidden bg-white relative">
                <Image src={c.img} alt={c.title} fill className="object-cover" unoptimized />
              </div>
              <p className="mt-4 text-sm text-[var(--text-tertiary)] flex items-center gap-1.5"><span className="text-sm">Webpage</span></p>
              <h3 className="mt-2 text-base text-[var(--text-primary)] font-[500]">{c.title}</h3>
            </div>
          ))}
        </div>
      </section>
    )
  }

  function Testimonials() {
    const items = [
      { name: "Rowan Cheung", title: "Founder @ Rundown AI", quote: "Manus is like Deep Research + Operator + Claude Computer combined, and it's REALLY good.", avatar: "https://files.manuscdn.com/webapp/_next/static/media/RowanCheung.1e57389c.webp" },
      { name: "Victor Mustar", title: "Head of Product @ Hugging Face", quote: "Manus is the most impressive AI tool I've ever tried.", avatar: "https://files.manuscdn.com/webapp/_next/static/media/VictorMustar.2293167d.webp" },
    ]

    return (
      <section className="max-w-[1048px] mx-auto px-4 md:px-6 mt-12">
        <h2 className="text-3xl font-[700] text-[var(--text-primary)] text-center font-serif">Wall of love</h2>
        <div className="mt-6 columns-1 sm:columns-2 lg:columns-3 gap-6">
          {items.map((it) => (
            <div key={it.name} className="mb-6 p-4 md:p-6 break-inside-avoid rounded-[16px] bg-white">
              <div className="text-[var(--text-primary)] mb-4">{it.quote}</div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[8px] overflow-hidden relative"><Image src={it.avatar} alt={it.name} fill className="object-cover" unoptimized /></div>
                <div>
                  <div className="text-sm font-[500]">{it.name}</div>
                  <div className="text-sm text-[var(--text-tertiary)]">{it.title}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  function Footer() {
    return (
      <footer className="bg-[var(--Button-primary-black)] mt-12 text-white">
        <div className="max-w-[1048px] mx-auto py-12 px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <h4 className="font-[500]">Company</h4>
            <a className="block text-sm text-[var(--text-white-tsp)] mt-2" href="/about">About us</a>
            <a className="block text-sm text-[var(--text-white-tsp)]" href="/careers">Careers</a>
          </div>
          <div>
            <h4 className="font-[500]">Resources</h4>
            <a className="block text-sm text-[var(--text-white-tsp)] mt-2" href="/playbook">Playbook</a>
          </div>
          <div>
            <h4 className="font-[500]">Community</h4>
            <a className="block text-sm text-[var(--text-white-tsp)] mt-2" href="/fellows">Fellows</a>
          </div>
          <div>
            <h4 className="font-[500]">Policy</h4>
            <a className="block text-sm text-[var(--text-white-tsp)] mt-2" href="/terms">Terms</a>
          </div>
        </div>
        <div className="max-w-[1048px] mx-auto px-6 pb-6 text-[var(--text-white-tsp)]">© 2025 Manus AI</div>
      </footer>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background-white-main)] text-[var(--text-primary)]">
      <Header />
      <main>
        <Hero />
        <FeatureGrid />
        <Testimonials />
      </main>
      <Footer />
    </div>
  )
}
