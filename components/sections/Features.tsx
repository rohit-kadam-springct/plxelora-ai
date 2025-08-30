'use client'

import { motion } from 'framer-motion'
import { Wand2, Palette, User, Zap, Download, Sparkles } from 'lucide-react'

const features = [
  {
    icon: Wand2,
    title: 'Smart AI Generation',
    description: 'Turn simple ideas into professional thumbnails using advanced AI that understands visual design.',
    gradientClass: 'icon-gradient-purple'
  },
  {
    icon: Palette,
    title: 'Style Consistency',
    description: 'Maintain your brand identity with custom style profiles that work across all your creations.',
    gradientClass: 'icon-gradient-blue'
  },
  {
    icon: User,
    title: 'Personal Touch',
    description: 'Add your unique persona to thumbnails automatically for better brand recognition.',
    gradientClass: 'icon-gradient-green'
  },
  {
    icon: Zap,
    title: 'Lightning Speed',
    description: 'Generate professional-quality thumbnails in seconds, not minutes or hours.',
    gradientClass: 'icon-gradient-yellow'
  },
  {
    icon: Download,
    title: 'Perfect Format',
    description: 'Optimized for all platforms with correct dimensions and quality settings.',
    gradientClass: 'icon-gradient-red'
  },
  {
    icon: Sparkles,
    title: 'Enhanced Prompts',
    description: 'Our AI improves your ideas automatically for better, more engaging results.',
    gradientClass: 'icon-gradient-indigo'
  },
]

export default function Features() {
  return (
    <section id="features" className="py-24 px-4">
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
            Simple Yet{' '}
            <span className="gradient-text">Powerful Features</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto text-balance">
            Everything you need to create compelling visuals that capture attention and drive engagement.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="feature-card-hover glass-morphism rounded-2xl p-8"
            >
              <div className={`inline-flex p-4 rounded-2xl ${feature.gradientClass} mb-6`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-2xl font-bold mb-4 text-white">
                {feature.title}
              </h3>

              <p className="text-gray-300 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
