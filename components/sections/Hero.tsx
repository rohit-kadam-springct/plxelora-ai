'use client'

import { motion } from 'framer-motion'
import { SignInButton, useUser } from '@clerk/nextjs'
import { Sparkles, Zap, Wand2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Link from 'next/link'

export default function Hero() {
  const { isSignedIn } = useUser()

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-20 left-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="relative z-10 text-center max-w-6xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-dark-800/50 border border-purple-500/30 rounded-full text-sm text-gray-300"
        >
          <Wand2 className="w-4 h-4 text-purple-400" />
          AI-Powered Visual Creation
          <Sparkles className="w-4 h-4 text-blue-400" />
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight"
        >
          Create with{' '}
          <span className="gradient-text">Pixelora AI</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto text-balance leading-relaxed"
        >
          Transform your ideas into stunning thumbnails with AI.
          Simple, powerful, and designed for creators who want results.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
        >
          {!isSignedIn ? (
            <SignInButton mode="modal">
              <Button size="lg" className="text-lg px-12 py-4">
                <Zap className="w-5 h-5 mr-2" />
                Start Creating
              </Button>
            </SignInButton>
          ) : (
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-12 py-4">
                <Wand2 className="w-5 h-5 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
          )}
          {/* <Button variant="outline" size="lg" className="text-lg px-8 py-4">
            See Examples
          </Button> */}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="grid grid-cols-3 gap-8 max-w-2xl mx-auto"
        >
          <div className="text-center">
            <div className="text-3xl font-bold gradient-text">5K+</div>
            <div className="text-gray-400 text-sm">Images Created</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold gradient-text">99%</div>
            <div className="text-gray-400 text-sm">Quality Score</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold gradient-text">10s</div>
            <div className="text-gray-400 text-sm">Average Generation</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
