import React, { useState } from 'react';
import { X, Check, Crown, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  icon: React.ElementType;
  popular?: boolean;
}

export default function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const plans: PricingPlan[] = [
    {
      id: 'pro',
      name: 'Pro',
      price: 29,
      description: 'Perfect for growing businesses',
      icon: Crown,
      features: [
        'Advanced Analytics',
        'Up to 10 social accounts',
        'Scheduled posts',
        'Custom reporting',
        'Team collaboration',
        'Priority support'
      ],
      popular: true
    },
    {
      id: 'business',
      name: 'Business',
      price: 99,
      description: 'For larger organizations',
      icon: Zap,
      features: [
        'Everything in Pro',
        'Unlimited social accounts',
        'AI content suggestions',
        'Advanced team roles',
        'Custom branding',
        'API access',
        'Dedicated account manager'
      ]
    }
  ];

  const handleUpgrade = async (planId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch('http://localhost:5000/api/billing/upgrade', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        throw new Error('Failed to upgrade plan');
      }

      // Redirect to checkout or handle success
      const { checkoutUrl } = await response.json();
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Upgrade error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Upgrade Your Plan
              </h2>
              <p className="mt-2 text-gray-600">
                Choose the perfect plan for your business needs
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              const Icon = plan.icon;

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative cursor-pointer rounded-2xl p-6 transition-all duration-200 ${
                    isSelected
                      ? 'border-2 border-blue-500 bg-blue-50'
                      : 'border-2 border-gray-100 hover:border-gray-200'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {plan.name}
                      </h3>
                      <p className="text-gray-600 mt-1">{plan.description}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${
                      isSelected ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        isSelected ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                    </div>
                  </div>

                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-gray-600">/month</span>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-gray-700">
                        <Check className={`w-5 h-5 mr-3 ${
                          isSelected ? 'text-blue-500' : 'text-green-500'
                        }`} />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loading}
                    className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                      isSelected
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading ? 'Processing...' : `Upgrade to ${plan.name}`}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              All plans include a 14-day free trial. No credit card required.
              <br />
              Questions? Contact our sales team for custom enterprise solutions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}