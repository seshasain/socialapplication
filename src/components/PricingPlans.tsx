import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plan, PlanType, SocialPlatform, PLANS } from '../types/plans';
import { useAuth } from '../context/AuthContext';

export default function PricingPlans() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const handlePlanSelect = (planId: PlanType) => {
    if (!isAuthenticated) {
      // Store selected plan in localStorage for after signup
      localStorage.setItem('selectedPlan', planId);
      navigate('/signup');
      return;
    }

    if (planId === 'trial') {
      navigate('/signup?plan=trial');
    } else {
      navigate(`/dashboard/billing?plan=${planId}`);
    }
  };

  const isTrialEligible = !user?.subscription || 
    (user.subscription.status !== 'trial' && !user.subscription.trialEnd);

  const plansArray = Object.values(PLANS) as Plan[];

  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Start managing your social media presence effectively
          </p>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:grid-cols-3">
          {plansArray.map((plan) => {
            // Only show trial plan if user is eligible
            if (plan.id === 'trial' && !isTrialEligible) {
              return null;
            }

            return (
              <div
                key={plan.id}
                className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200 bg-white"
              >
                <div className="p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {plan.name}
                  </h3>
                  <p className="mt-4 text-sm text-gray-500">{plan.description}</p>
                  <p className="mt-8">
                    <span className="text-4xl font-extrabold text-gray-900">
                      ${plan.price.monthly}
                    </span>
                    <span className="text-base font-medium text-gray-500">/mo</span>
                  </p>
                  <button
                    onClick={() => handlePlanSelect(plan.id)}
                    className="mt-8 block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150 ease-in-out"
                  >
                    {plan.id === 'trial' ? 'Start Free Trial' : 'Get Started'}
                  </button>
                </div>
                <div className="pt-6 pb-8 px-6">
                  <h4 className="text-sm font-medium text-gray-900 tracking-wide uppercase">
                    What's included
                  </h4>
                  <ul className="mt-6 space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex space-x-3">
                        <svg
                          className="flex-shrink-0 h-5 w-5 text-green-500"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm text-gray-500 capitalize">
                          {feature.replace('_', ' ')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 