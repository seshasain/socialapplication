import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';

interface PricingPlan {
  name: string;
  price: number;
  features: string[];
  cta: string;
  popular?: boolean;
}

interface PricingProps {
  plans: PricingPlan[];
  onPlanSelect: (plan: string) => void;
}

export default function PricingSection({ plans, onPlanSelect }: PricingProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(
    'monthly'
  );

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

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
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-xl text-gray-500">
            Choose the perfect plan for your needs
          </p>
        </motion.div>

        <div className="mt-12 flex justify-center">
          <div className="relative bg-white rounded-full p-1 flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500'
              } relative w-32 rounded-full py-2 text-sm font-medium transition-colors duration-200`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`${
                billingCycle === 'annual'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500'
              } relative w-32 rounded-full py-2 text-sm font-medium transition-colors duration-200`}
            >
              Annual
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-3"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={item}
              className={`relative bg-white rounded-2xl shadow-lg transform hover:-translate-y-1 transition-all duration-300 ${
                plan.popular ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 -mr-1 -mt-1 w-24 h-24 overflow-hidden">
                  <div className="absolute transform rotate-45 bg-blue-600 text-white text-xs text-center font-semibold py-1 right-[-35px] top-[32px] w-[170px]">
                    Popular
                  </div>
                </div>
              )}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900">
                  {plan.name}
                </h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-5xl font-extrabold text-gray-900">
                    $
                    {billingCycle === 'annual'
                      ? Math.floor(plan.price * 0.8)
                      : plan.price}
                  </span>
                  <span className="ml-1 text-xl font-medium text-gray-500">
                    /{billingCycle === 'annual' ? 'year' : 'month'}
                  </span>
                </div>

                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="ml-3 text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onPlanSelect(plan.name)}
                  className={`mt-8 w-full py-3 px-6 rounded-xl text-center font-medium flex items-center justify-center ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  } transition-colors duration-200`}
                >
                  {plan.cta}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-12 text-center text-gray-500"
        >
          <p>
            All plans include a 14-day free trial. No credit card required.
            <br />
            Questions? Contact our sales team for custom enterprise solutions.
          </p>
        </motion.div>
      </div>
    </div>
  );
}