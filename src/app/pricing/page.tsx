'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Set page title
  useEffect(() => {
    document.title = 'Pricing - Manus AI Assistant'
  }, [])

  const handlePlanSelection = async (planName: string) => {
    setIsLoading(true)
    // Simulate loading state
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (planName === 'Starter') {
      router.push('/auth/signup?plan=free')
    } else if (planName === 'Pro') {
      router.push('/auth/signup?plan=pro')
    } else {
      router.push('/contact?plan=enterprise')
    }
    setIsLoading(false)
  }

  const plans = {
    starter: {
      name: 'Starter',
      description: 'Perfect for individuals exploring AI assistance',
      price: { monthly: 0, annual: 0 },
      originalPrice: { monthly: 0, annual: 0 },
      features: [
        '100 AI conversations per month',
        'Basic text generation',
        'Standard response time',
        'Web interface access',
        'Community support',
        'Basic templates',
        'Email support'
      ],
      limitations: [
        'Limited to personal use',
        'Basic AI models only',
        'No API access'
      ],
      cta: 'Get Started Free',
      popular: false,
      color: 'from-blue-500 to-blue-600',
      badge: 'Free Forever'
    },
    pro: {
      name: 'Pro',
      description: 'For professionals and growing teams',
      price: { monthly: 20, annual: 200 },
      originalPrice: { monthly: 25, annual: 240 },
      features: [
        'Unlimited AI conversations',
        'Advanced GPT-4 & Claude models',
        'Priority response time (<2s)',
        'API access (50K calls/month)',
        'Priority email & chat support',
        'Custom templates & workflows',
        'File uploads & analysis (PDF, DOC, etc.)',
        'Export conversations (PDF, MD)',
        'Advanced integrations (Slack, Teams)',
        'Usage analytics & insights',
        'Custom AI personas',
        'Collaboration features'
      ],
      limitations: [],
      cta: 'Start 14-Day Free Trial',
      popular: true,
      color: 'from-orange-500 to-pink-600',
      badge: 'Most Popular'
    },
    enterprise: {
      name: 'Enterprise',
      description: 'For large teams and organizations',
      price: { monthly: 'Custom', annual: 'Custom' },
      originalPrice: { monthly: 'Custom', annual: 'Custom' },
      features: [
        'Everything in Pro',
        'Unlimited API calls',
        'Custom AI model fine-tuning',
        'Dedicated customer success manager',
        '99.99% SLA guarantee',
        'Advanced security (SOC2, GDPR)',
        'Custom integrations & workflows',
        'Team analytics & reporting',
        'Single sign-on (SSO)',
        'On-premise deployment options',
        'White-label solutions',
        'Custom training & onboarding',
        'Priority phone support',
        'Custom billing & invoicing'
      ],
      limitations: [],
      cta: 'Contact Sales Team',
      popular: false,
      color: 'from-purple-500 to-purple-600',
      badge: 'Custom Solutions'
    }
  }

  const faqs = [
    {
      question: "How does the free trial work?",
      answer: "Start your 14-day Pro trial instantly - no credit card required. You'll have full access to all Pro features. After the trial, you can choose to subscribe or continue with our free Starter plan."
    },
    {
      question: "Can I change my plan at any time?",
      answer: "Absolutely! You can upgrade, downgrade, or cancel at any time. Changes take effect immediately, and we'll handle all billing adjustments automatically with prorated refunds or charges."
    },
    {
      question: "What happens if I exceed my usage limits?",
      answer: "For Starter users, you'll receive notifications as you approach your limits. Pro users get flexible overage pricing at $0.002 per additional API call. Enterprise customers have custom limits based on their needs."
    },
    {
      question: "How secure is my data?",
      answer: "We take security seriously. All data is encrypted in transit and at rest. Pro and Enterprise plans include advanced security features, and Enterprise customers get SOC2 compliance and custom security configurations."
    },
    {
      question: "Do you offer refunds?",
      answer: "Yes! We offer a 30-day money-back guarantee for all paid plans. If you're not completely satisfied, contact us for a full refund - no questions asked."
    },
    {
      question: "Can I use Manus for my business?",
      answer: "Definitely! Pro and Enterprise plans include full commercial usage rights. The free Starter plan is limited to personal and educational use only."
    },
    {
      question: "What AI models do you support?",
      answer: "We support the latest AI models including GPT-4, GPT-4 Turbo, Claude 3, and more. Pro users get access to advanced models, while Enterprise customers can request specific model integrations."
    },
    {
      question: "How does billing work?",
      answer: "We bill monthly or annually based on your preference. Annual plans save you 17%. Enterprise customers can choose custom billing cycles and receive detailed invoicing with purchase orders."
    }
  ]

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
        <div className="absolute top-40 left-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-60 right-10 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-1/3 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-2000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
              Choose your
            </span>
            <br />
            <span className="bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent">
              AI journey
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            From individual creativity to enterprise solutions, find the perfect plan 
            to unlock your potential with advanced AI assistance.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-lg font-medium transition-colors ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <div className="relative">
              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                className={`relative w-16 h-8 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                  billingCycle === 'annual' 
                    ? 'bg-gradient-to-r from-orange-500 to-pink-600' 
                    : 'bg-gray-200'
                }`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 ${
                  billingCycle === 'annual' ? 'translate-x-9' : 'translate-x-1'
                }`}></div>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-medium transition-colors ${billingCycle === 'annual' ? 'text-gray-900' : 'text-gray-500'}`}>
                Annual
              </span>
              <div className="relative">
                <span className="px-3 py-1 bg-gradient-to-r from-green-400 to-green-600 text-white text-sm font-medium rounded-full shadow-lg">
                  Save 17%
                </span>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 mb-20">
          {Object.entries(plans).map(([key, plan]) => (
            <div
              key={key}
              className={`relative group transition-all duration-500 ${
                plan.popular ? 'lg:scale-105 lg:-translate-y-4' : ''
              }`}
              onMouseEnter={() => setHoveredPlan(key)}
              onMouseLeave={() => setHoveredPlan(null)}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center z-10">
                  <span className="bg-gradient-to-r from-orange-500 to-pink-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    {plan.badge}
                  </span>
                </div>
              )}
              
              {!plan.popular && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center z-10">
                  <span className="bg-gray-600 text-white px-4 py-1 rounded-full text-xs font-medium">
                    {plan.badge}
                  </span>
                </div>
              )}
              
              <div className={`relative p-8 bg-white/80 backdrop-blur-sm border-2 rounded-3xl shadow-xl transition-all duration-500 h-full ${
                plan.popular 
                  ? 'border-orange-200 shadow-orange-100/50 bg-gradient-to-br from-white to-orange-50/30' 
                  : 'border-gray-200 hover:border-gray-300'
              } ${
                hoveredPlan === key ? 'shadow-2xl scale-[1.02] -translate-y-2' : ''
              }`}>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  
                  <div className="mb-8">
                    {typeof plan.price[billingCycle] === 'number' ? (
                      <>
                        <div className="flex items-center justify-center gap-2 mb-2">
                          {billingCycle === 'annual' && plan.originalPrice.monthly !== plan.price.monthly && (
                            <span className="text-lg text-gray-400 line-through">
                              ${typeof plan.originalPrice[billingCycle] === 'number' ? plan.originalPrice[billingCycle] : 0}
                            </span>
                          )}
                          <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                              ${plan.price[billingCycle]}
                            </span>
                            {plan.price[billingCycle] > 0 && (
                              <span className="text-gray-500 text-lg">
                                /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                              </span>
                            )}
                          </div>
                        </div>
                        {billingCycle === 'annual' && typeof plan.price.monthly === 'number' && plan.price.monthly > 0 && (
                          <p className="text-sm text-green-600 font-medium">
                            ${Math.round((plan.price.annual as number) / 12)}/month when billed annually
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        {plan.price[billingCycle]}
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => handlePlanSelection(plan.name)}
                    disabled={isLoading}
                    className={`w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-all duration-300 relative overflow-hidden group ${
                      plan.popular
                        ? 'bg-gradient-to-r from-orange-500 to-pink-600 text-white hover:from-orange-600 hover:to-pink-700 shadow-lg hover:shadow-xl'
                        : 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg hover:shadow-xl'
                    } hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <span className="relative">
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          Loading...
                        </div>
                      ) : (
                        plan.cta
                      )}
                    </span>
                  </button>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 text-lg border-b border-gray-200 pb-2">
                    What's included:
                  </h4>
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
                    </div>
                  ))}
                  
                  {plan.limitations && plan.limitations.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h5 className="font-medium text-gray-700 mb-3 text-sm">Limitations:</h5>
                      {plan.limitations.map((limitation, index) => (
                        <div key={index} className="flex items-start gap-3 mb-2">
                          <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span className="text-gray-500 text-xs">{limitation}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced FAQ Section */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about our pricing and features
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">{faq.question}</h3>
                  <div className={`transform transition-transform duration-300 ${
                    expandedFaq === index ? 'rotate-180' : ''
                  }`}>
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${
                  expandedFaq === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="px-6 pb-6">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced CTA Section */}
        <div className="relative">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-purple-500/10 rounded-3xl"></div>
          
          <div className="relative text-center bg-white/50 backdrop-blur-sm rounded-3xl p-12 border border-gray-200 shadow-xl">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Ready to transform your workflow?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Join over 50,000 professionals who trust Manus to enhance their productivity and unleash their creativity.
              </p>
              
              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center gap-6 mb-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>No setup fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Cancel anytime</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>30-day money back</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link href="/auth/signup?plan=pro" className="group relative px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <span className="relative">Start 14-Day Free Trial</span>
                </Link>
                <Link href="/chat" className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-full font-semibold text-lg hover:border-orange-400 hover:text-orange-600 transition-all duration-300 hover:scale-105 bg-white/70 backdrop-blur-sm">
                  Try Demo First
                </Link>
              </div>
              
              {/* Social proof */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  Trusted by 50,000+ users • Rated 4.9/5 stars
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
