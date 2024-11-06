import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  image: string;
  stats: {
    engagement: string;
    followers: string;
    timesSaved: string;
  };
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
}

export default function TestimonialCarousel({
  testimonials,
}: TestimonialCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [testimonials.length]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex(
      (prev) =>
        (prev + newDirection + testimonials.length) % testimonials.length
    );
  };

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-between z-10">
        <button
          onClick={() => paginate(-1)}
          className="p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white transition-colors ml-4"
        >
          <ChevronLeft className="w-6 h-6 text-gray-800" />
        </button>
        <button
          onClick={() => paginate(1)}
          className="p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white transition-colors mr-4"
        >
          <ChevronRight className="w-6 h-6 text-gray-800" />
        </button>
      </div>

      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x);

            if (swipe < -swipeConfidenceThreshold) {
              paginate(1);
            } else if (swipe > swipeConfidenceThreshold) {
              paginate(-1);
            }
          }}
          className="w-full"
        >
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur opacity-50" />
                <img
                  className="relative h-16 w-16 rounded-full object-cover ring-2 ring-white"
                  src={testimonials[currentIndex].image}
                  alt={testimonials[currentIndex].author}
                />
              </div>
              <div className="ml-4">
                <div className="text-xl font-bold text-gray-900">
                  {testimonials[currentIndex].author}
                </div>
                <div className="text-blue-600">
                  {testimonials[currentIndex].role}
                </div>
                <div className="text-sm text-gray-500">
                  {testimonials[currentIndex].company}
                </div>
              </div>
            </div>

            <blockquote className="text-gray-600 italic mb-8 relative">
              <div className="absolute -top-4 -left-4 text-blue-200 transform -rotate-180">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 40 40"
                  fill="currentColor"
                >
                  <path d="M12 4C5.4 8.6 1 15.5 1 23.5c0 6.4 3.9 10.5 8.3 10.5 4.2 0 7.4-3.4 7.4-7.4 0-4-2.8-7-6.4-7-0.7 0-1.7 0.1-1.9 0.2 0.6-4.1 4.5-9 8.3-11.3L12 4zm20.5 0c-6.6 4.6-11 11.5-11 19.5 0 6.4 3.9 10.5 8.3 10.5 4.2 0 7.4-3.4 7.4-7.4 0-4-2.8-7-6.4-7-0.7 0-1.7 0.1-1.9 0.2 0.6-4.1 4.5-9 8.3-11.3L32.5 4z" />
                </svg>
              </div>
              {testimonials[currentIndex].quote}
            </blockquote>

            <div className="grid grid-cols-3 gap-4">
              {Object.entries(testimonials[currentIndex].stats).map(
                ([key, value]) => (
                  <div key={key} className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {value}
                    </div>
                    <div className="text-sm text-gray-500">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1);
              setCurrentIndex(index);
            }}
            className={`w-2 h-2 rounded-full transition-colors duration-200 ${
              index === currentIndex
                ? 'bg-blue-600'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
}