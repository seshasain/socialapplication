import React from 'react';
import { X, Check } from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PricingModal({ isOpen, onClose }: PricingModalProps) {
  if (!isOpen) return null;

  const plans = [
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
      highlight: false,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Upgrade Your Plan</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`bg-white rounded-xl overflow-hidden transform transition-all duration-200 ${
                  plan.highlight ? 'ring-2 ring-blue-600 shadow-xl' : 'border border-gray-200 shadow-sm'
                }`}
              >
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                    <span className="ml-2 text-gray-600">/{plan.duration}</span>
                  </div>

                  <ul className="mt-6 space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-3" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`mt-8 w-full px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
                      plan.highlight
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-gray-600">
            Need a custom solution? <button className="text-blue-600 hover:text-blue-700">Contact our sales team</button>
          </p>
        </div>
      </div>
    </div>
  );
}