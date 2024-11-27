import React, { useState } from 'react';
import { Check, X, Rocket, Zap, Star, ArrowRight, Shield, Sparkles, Users, MessageCircle } from 'lucide-react';

function App() {
  const [isAnnual, setIsAnnual] = useState(false);

  const calculatePrice = (basePrice: number) => {
    const annualDiscount = 0.8; // 20% off
    return isAnnual ? Math.floor(basePrice * annualDiscount) : basePrice;
  };

  const plans = [
    {
      name: 'Free',
      icon: <Rocket className="w-8 h-8 text-indigo-500" />,
      basePrice: 0,
      features: [
        'Schedule up to 10 posts',
        '1 social account',
        '1 Notion database',
        '5MB image uploads',
        '50MB video uploads',
        'Basic scheduling'
      ],
      buttonText: 'Get Started Free',
      highlight: false,
      badge: '💫 No credit card required'
    },
    {
      name: 'Basic',
      icon: <Zap className="w-8 h-8 text-blue-500" />,
      basePrice: 19,
      features: [
        'Unlimited scheduled posts',
        '3 social accounts',
        '1 Notion database',
        '30MB image uploads',
        '300MB video uploads',
        'Post analytics',
        'Priority support'
      ],
      buttonText: 'Upgrade to Basic',
      highlight: true,
      badge: '✨ Most Popular'
    },
    {
      name: 'Premium',
      icon: <Star className="w-8 h-8 text-amber-500" />,
      basePrice: 29,
      features: [
        'Everything in Basic',
        '10 social accounts',
        '5 Notion databases',
        'Advanced analytics',
        'Team collaboration',
        'Custom integrations',
        '24/7 priority support'
      ],
      buttonText: 'Upgrade to Premium',
      highlight: false,
      badge: '🚀 Full Power'
    }
  ];
const featureComparison = {
    categories: [
      {
        name: 'Essentials',
        icon: <Shield className="w-5 h-5" />,
        features: [
          { name: 'Scheduled posts', values: ['10 posts', 'Unlimited', 'Unlimited'] },
          { name: 'Social Accounts', values: ['1', '3', '10'] },
          { name: 'Notion Databases', values: ['1', '1', '5'] },
          { name: 'Post analytics', values: [false, true, true] },
          { name: 'Post-Publish actions', values: [false, true, true] },
          { name: 'Live Support', values: [false, true, true] }
        ]
      },
      {
        name: 'Post Features',
        icon: <Sparkles className="w-5 h-5" />,
        features: [
          { name: 'Image size limit', values: ['5 MB', '30 MB', '30 MB'] },
          { name: 'Video size limit', values: ['50 MB', '300 MB', '300 MB'] },
          { name: 'Twitter threads', values: [false, true, true] },
          { name: 'Facebook Reels & Story', values: [false, true, true] },
          { name: 'Instagram Reels & Story', values: [false, true, true] },
          { name: 'LinkedIn Document', values: [false, true, true] },
          { name: 'First Comment', values: [false, true, true] },
          { name: 'Tag Users on Images', values: [false, false, true] },
          { name: 'Tag Collaborators', values: [false, false, true] }
        ]
      }
    ]
  };
  const handlePlanSelection = async (planName: string, price: number) => {
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: planName,
          billingCycle: isAnnual ? 'annual' : 'monthly',
          price: price
        }),
      });
      
      if (!response.ok) {
        throw new Error('Subscription failed');
      }

      const data = await response.json();
      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error('Subscription error:', error);
      // Handle error (show toast notification, etc.)
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-20">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="animate-bounce mb-4 inline-block">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              ✨ Special Launch Pricing
            </span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Scale your social media presence with powerful tools that grow with your needs
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center space-x-4 bg-white rounded-full px-6 py-3 shadow-lg">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-blue-600' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
              style={{ backgroundColor: isAnnual ? '#3B82F6' : '#94A3B8' }}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAnnual ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${isAnnual ? 'text-blue-600' : 'text-gray-500'}`}>
                Annual
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                Save 20%
              </span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative group bg-white rounded-3xl shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
                plan.highlight ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {plan.badge && (
                <div className="absolute top-6 right-6">
                  <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="p-8">
                <div className="flex items-center mb-6">
                  <div className="p-2 rounded-xl bg-blue-50 shadow-sm">
                    {plan.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 ml-3">{plan.name}</h3>
                </div>

                <div className="flex items-baseline mb-8">
                  <span className="text-5xl font-extrabold text-blue-600">
                    ${calculatePrice(plan.basePrice)}
                  </span>
                  <span className="ml-2 text-gray-600">
                    /mo
                  </span>
                  {isAnnual && plan.basePrice > 0 && (
                    <span className="ml-2 text-sm text-gray-400 line-through">
                      ${plan.basePrice}
                    </span>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-50">
                        <Check className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="ml-3 text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePlanSelection(plan.name, calculatePrice(plan.basePrice))}
                  className={`w-full px-6 py-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                      : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span>{plan.buttonText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        {/* Feature Comparison */}
        <div className="mb-32">
          <h2 className="text-3xl font-bold text-center mb-16 bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent">
            Compare Plans in Detail
          </h2>
          <div className="overflow-hidden bg-white rounded-3xl shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-6 px-6 text-left font-medium text-gray-500"></th>
                    {plans.map((plan) => (
                      <th key={plan.name} className="py-6 px-6 text-center">
                        <div className="flex flex-col items-center">
                          <div className="p-2 rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-sm mb-2">
                            {plan.icon}
                          </div>
                          <span className="font-medium text-gray-900">{plan.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {featureComparison.categories.map((category) => (
                    <React.Fragment key={category.name}>
                      <tr className="bg-gradient-to-r from-blue-50 to-pink-50">
                        <td
                          colSpan={4}
                          className="py-4 px-6 font-semibold text-blue-900 flex items-center"
                        >
                          {category.icon}
                          <span className="ml-2">{category.name}</span>
                        </td>
                      </tr>
                      {category.features.map((feature, idx) => (
                        <tr
                          key={feature.name}
                          className={`border-t border-gray-100 ${
                            idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                          }`}
                        >
                          <td className="py-4 px-6 text-gray-900">{feature.name}</td>
                          {feature.values.map((value, index) => (
                            <td key={index} className="py-4 px-6 text-center">
                              {typeof value === 'boolean' ? (
                                value ? (
                                  <div className="flex items-center justify-center">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                      <Check className="w-4 h-4 text-blue-600" />
                                    </div>
                                  </div>
                                ) : (
                                  <X className="w-5 h-5 text-gray-300 mx-auto" />
                                )
                              ) : (
                                <span className="text-gray-900 font-medium">{value}</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
{/* Features Grid */}
        <div className="mt-24 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">Everything you need to succeed</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Users className="w-6 h-6 text-purple-500" />,
                title: 'Team Collaboration',
                description: 'Work together seamlessly with your team members',
              },
              {
                icon: <Shield className="w-6 h-6 text-indigo-500" />,
                title: 'Advanced Security',
                description: 'Enterprise-grade security for your social media accounts',
              },
              {
                icon: <MessageCircle className="w-6 h-6 text-blue-500" />,
                title: '24/7 Support',
                description: 'Get help whenever you need it from our expert team',
              },
            ].map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-50 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
        {/* CTA Section */}
        <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl shadow-xl p-16">
          <h2 className="text-4xl font-bold text-blue-600 mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-gray-600 text-lg mb-10 max-w-2xl mx-auto">
            Join thousands of creators and businesses using our platform to grow their social media presence.
          </p>
          <button 
            onClick={() => handlePlanSelection('free', 0)}
            className="inline-flex items-center px-8 py-4 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
          >
            Start Your Free Trial
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
          <p className="mt-6 text-sm text-gray-500">No credit card required • Cancel anytime</p>
        </div>
      </div>
    </div>
  );
}

export default App;