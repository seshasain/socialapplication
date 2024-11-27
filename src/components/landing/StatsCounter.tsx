import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface StatsCounterProps {
  value: string;
  label: string;
  icon: React.ElementType;
  color: string;
  delay?: number;
}

export default function StatsCounter({
  value,
  label,
  icon: Icon,
  color,
  delay = 0,
}: StatsCounterProps) {
  const [count, setCount] = useState(0);
  const numericValue = parseInt(value.replace(/[^0-9]/g, ''));
  const suffix = value.replace(/[0-9]/g, '');

  useEffect(() => {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = numericValue / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setCount(numericValue);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [numericValue]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="group relative bg-white/50 backdrop-blur-lg rounded-xl p-6 hover:bg-white/80 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative">
        <div className={`p-3 bg-${color}-100 rounded-lg w-fit mb-4`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {count}
          {suffix}
        </div>
        <div className="mt-1 text-sm text-gray-500">{label}</div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-b-xl" />
    </motion.div>
  );
}

























