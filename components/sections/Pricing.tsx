'use client'

import { motion } from 'framer-motion'
import { Check, Star, Zap } from 'lucide-react'
import { SignInButton, useUser } from '@clerk/nextjs'
import Button from '@/components/ui/Button'

const pricingPlans = [
  {
    name: 'Free',
    price: '₹0',
    credits: 5,
    description: 'Try Pixelora AI for free',
    features: [
      '5 generation credits',
      '1 custom style',
      '1 persona',
      'HD downloads with watermark',
      'Community support',
    ],
    popular: false,
  },
  {
    name: 'Creator',
    price: '₹599',
    credits: 50,
    description: 'Perfect for active creators',
    features: [
      '50 generation credits',
      'Unlimited styles',
      'Unlimited personas',
      '4K downloads (no watermark)',
      'Priority support',
      'Batch generation',
    ],
    popular: true,
  },
  {
    name: 'Pro',
    price: 'Pay-as-use',
    credits: null,
    description: 'For professional teams',
    features: [
      '₹12 per credit',
      'Everything in Creator',
      'White-label options',
      'Custom integrations',
      'Dedicated support',
    ],
    popular: false,
    comingSoon: true,
    payAsUse: {
      pricePerCredit: '₹12',
      minimumSpend: '₹2,000/month'
    }
  },
]



export default function Pricing() {
  const { isSignedIn } = useUser()

  return (
    <section id="pricing" className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Fair{' '}
            <span className="gradient-text">Credit-Based</span>
            {' '}Pricing
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto text-balance mb-6">
            Only pay for what you create. No subscriptions, no hidden fees.
            Each generation uses credits based on complexity.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-sm">
            <Star className="w-4 h-4" />
            Early access pricing - may change as we improve
          </div>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`relative rounded-2xl p-8 ${plan.popular
                ? 'pricing-card-popular'
                : 'glass-morphism'
                }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-black">{plan.price}</span>
                  {!plan.payAsUse && <span className="text-gray-400 ml-2">one-time</span>}
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-semibold mb-4">
                  <Zap className="w-4 h-4" />
                  {plan.credits} Credits
                </div>
                <p className="text-gray-300">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="text-center">
                {!isSignedIn ? (
                  <SignInButton mode="modal">
                    <Button
                      variant={plan.popular ? 'primary' : 'outline'}
                      size="lg"
                      className="w-full"
                      disabled={plan.comingSoon}
                    >
                      {plan.comingSoon ? "Coming Soon" : "Get Started"}
                    </Button>
                  </SignInButton>
                ) : (
                  <Button
                    variant={plan.popular ? 'primary' : 'outline'}
                    size="lg"
                    className="w-full"
                  >
                    Purchase Credits
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Credit usage info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 glass-morphism rounded-2xl p-8 max-w-4xl mx-auto"
        >
          <h3 className="text-2xl font-bold mb-6 text-center">How Credits Work</h3>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold gradient-text mb-2">1-2</div>
              <div className="font-semibold mb-1">Credits per Generation</div>
              <div className="text-sm text-gray-400">Based on quality settings</div>
            </div>
            <div>
              <div className="text-3xl font-bold gradient-text mb-2">3</div>
              <div className="font-semibold mb-1">Credits per Style</div>
              <div className="text-sm text-gray-400">One-time style creation</div>
            </div>
            <div>
              <div className="text-3xl font-bold gradient-text mb-2">1</div>
              <div className="font-semibold mb-1">Credit per Persona</div>
              <div className="text-sm text-gray-400">One-time persona setup</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
