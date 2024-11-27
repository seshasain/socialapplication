import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, CheckCircle } from 'lucide-react';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  benefits: string[];
  stats: {
    improvement: string;
    metric: string;
  };
}

interface FeatureShowcaseProps {
  features: Feature[];
}

export default function FeatureShowcase({ features }: FeatureShowcaseProps) {
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<string>(features[0].id);

  return (
    <div className="bg-gray-50 py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 sm:text-4xl">
            Powerful Features for Growth
          </h2>
          <p className="mt-4 text-xl text-gray-500">
            Everything you need to succeed on social media
          </p>
        </motion.div>

        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative group cursor-pointer"
                onMouseEnter={() => setHoveredFeature(feature.id)}
                onMouseLeave={() => setHoveredFeature(null)}
                onClick={() => setSelectedFeature(feature.id)}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                <div className="relative bg-white p-8 rounded-lg ring-1 ring-gray-900/5">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`p-3 bg-${
                        feature.stats.improvement.includes('+') ? 'green' : 'red'
                      }-100 rounded-xl transform group-hover:scale-110 transition-transform duration-300`}
                    >
                      <feature.icon
                        className={`h-6 w-6 text-${
                          feature.stats.improvement.includes('+') ? 'green' : 'red'
                        }-600`}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {feature.title}
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  <AnimatePresence>
                    {(hoveredFeature === feature.id ||
                      selectedFeature === feature.id) && (
                      <motion.ul
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-6 space-y-4 overflow-hidden"
                      >
                        {feature.benefits.map((benefit) => (
                          <motion.li
                            key={benefit}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex items-start"
                          >
                            <div className="flex-shrink-0">
                              <CheckCircle className="h-6 w-6 text-green-500" />
                            </div>
                            <p className="ml-3 text-sm text-gray-500">
                              {benefit}
                            </p>
                          </motion.li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>

                  <div className="mt-8 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {feature.stats.improvement}
                      </span>
                      <span className="text-sm text-gray-500">
                        {feature.stats.metric}
                      </span>
                    </div>
                    <motion.button
                      whileHover={{ x: 5 }}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
                    >
                      Learn more
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
