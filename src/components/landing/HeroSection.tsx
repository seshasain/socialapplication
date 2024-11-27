import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import StatsCounter from './StatsCounter';

interface HeroProps {
  onDemoClick: () => void;
  stats: Array<{
    value: string;
    label: string;
    icon: React.ElementType;
    color: string;
  }>;
}

export default function HeroSection({ onDemoClick, stats }: HeroProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-24 sm:pb-20"
      >
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight"
          >
            <span className="block">Transform Your</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mt-2">
              Social Media Presence
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-6 max-w-2xl mx-auto text-xl text-gray-500"
          >
            One platform to schedule posts, track performance, and grow your
            social media presence with AI-powered insights.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-8 flex justify-center space-x-4"
          >
            <Link
              to="/signup"
              className="group inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button
              onClick={onDemoClick}
              className="group inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-xl text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all duration-200 transform hover:scale-105"
            >
              Watch Demo
              <Play className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
            </button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4"
          >
            {stats.map((stat, index) => (
              <StatsCounter
                key={stat.label}
                value={stat.value}
                label={stat.label}
                icon={stat.icon}
                color={stat.color}
                delay={index * 0.2}
              />
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Animated Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-indigo-400/10 backdrop-blur-[100px]" />
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-b from-blue-50 to-transparent transform rotate-45 origin-bottom-left animate-pulse" />
        <div className="absolute top-0 left-0 w-full h-full">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-400/20"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 100 + 50}px`,
                height: `${Math.random() * 100 + 50}px`,
                animation: `float ${Math.random() * 10 + 5}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}