'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const faqs = [
  {
    question: 'How does Pixelora AI work?',
    answer: 'Pixelora AI uses advanced machine learning models to generate thumbnails from your text descriptions. Simply describe what you want, and our AI creates professional-quality visuals in seconds.'
  },
  {
    question: 'What makes the credit system fair?',
    answer: 'Credits only get consumed when you successfully generate content. Failed generations don\'t cost credits, and you can preview before finalizing. Credits never expire.'
  },
  {
    question: 'Can I use generated images commercially?',
    answer: 'Yes! All images created with Pixelora AI are yours to use commercially without restrictions. Perfect for YouTube, social media, marketing, or any business needs.'
  },
  {
    question: 'What image quality do I get?',
    answer: 'We generate high-quality images at 1280x720 pixels (perfect for thumbnails) in PNG format. Higher resolutions and different formats are coming soon.'
  },
  {
    question: 'How accurate is the persona feature?',
    answer: 'Our persona integration maintains facial features with 85-95% accuracy. The AI learns from your uploaded image to consistently apply your likeness across generations.'
  },
  {
    question: 'Do you offer refunds?',
    answer: 'Due to computational costs, we don\'t offer refunds. However, new users get trial credits, and we provide support for any generation issues you encounter.'
  },
  {
    question: 'Is there an API for developers?',
    answer: 'Yes! Pro plan users get API access for integrating Pixelora AI into their applications, workflows, or custom tools.'
  },
  {
    question: 'How fast is image generation?',
    answer: 'Most images generate in 10-20 seconds. Speed depends on complexity and current server load, but we\'re constantly optimizing for faster results.'
  }
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Common{' '}
            <span className="gradient-text">Questions</span>
          </h2>
          <p className="text-xl text-gray-300 text-balance">
            Everything you need to know about Pixelora AI
          </p>
        </motion.div>

        {/* FAQ items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="faq-item"
            >
              <button
                className="faq-button"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <h3 className="text-lg font-semibold pr-8">{faq.question}</h3>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-purple-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-purple-400 flex-shrink-0" />
                )}
              </button>

              <motion.div
                initial={false}
                animate={{
                  height: openIndex === index ? 'auto' : 0,
                  opacity: openIndex === index ? 1 : 0
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6">
                  <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
