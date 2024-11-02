import React from 'react';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PricingPage() {
  const plans = [
    {
      name: 'Free Trial',
      price: '$0',
      duration: '7 days',
      features: [
        'Schedule up to 10 posts',
        'Basic analytics',
        'Single user account',
        'Connect 2 social accounts',
      ],
      buttonText: 'Start Free Trial',
      buttonLink: '/signup',
      highlight: false,
    },
    {
      name: 'Standard',
      price: '$29',
      duration: 'per month',
      features: [
        'Unlimited scheduled posts',
        'Advanced analytics',
        'Up to 3 team members',
        'Connect 5 social accounts',
        'Custom branded reports',
        'Priority email support',
      ],
      buttonText: 'Get Started',
      buttonLink: '/signup?plan=standard',
      highlight: true,
    },
    {
      name: 'Gold',
      price: '$79',
      duration: 'per month',
      features: [
        'Everything in Standard',
        'Unlimited team members',
        'Connect 15 social accounts',
        'AI content suggestions',
        'White-label reports',
        '24/7 priority support',
        'Custom integrations',
      ],
      buttonText: 'Contact Sales',
      buttonLink: '/contact',
      highlight: false,
    },
  ];

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Scale your social media presence with our powerful scheduling and analytics tools
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-2xl shadow-xl overflow-hidden transform hover:-translate-y-1 transition-all duration-200 ${
                plan.highlight ? 'ring-2 ring-blue-600' : ''
              }`}
            >
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="ml-2 text-gray-600">/{plan.duration}</span>
                </div>

                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={plan.buttonLink}
                  className={`mt-8 block w-full text-center px-6 py-3 rounded-lg text-sm font-medium ${
                    plan.highlight
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  } transition-colors`}
                >
                  {plan.buttonText}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Trusted by Leading Brands</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Add company logos here */}
            <div className="h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
              <span className="text-gray-400">Brand Logo</span>
            </div>
            <div className="h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
              <span className="text-gray-400">Brand Logo</span>
            </div>
            <div className="h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
              <span className="text-gray-400">Brand Logo</span>
            </div>
            <div className="h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
              <span className="text-gray-400">Brand Logo</span>
            </div>
          </div>
        </div>

        <div className="mt-16 bg-white rounded-2xl shadow-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Need a Custom Solution?</h2>
          <p className="text-gray-600 mb-8">
            Contact our sales team for a tailored package that meets your specific needs
          </p>
          <Link
            to="/contact"
            className="inline-block bg-gray-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Contact Sales
          </Link>
        </div>
      </div>
    </div>
  );
}