import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plan, PlanType, PlanFeature, PlanLimits, PLANS, BASIC_PLATFORMS, PRO_PLATFORMS, PLATFORM_NAMES, SocialPlatform } from '../types/plans';
import { useAuth } from '../context/AuthContext';
import { SubscriptionStatus } from '../types/subscription';
import { Check } from 'lucide-react';

interface AuthUser {
  id: string;
  email: string;
  subscription?: {
    id: string;
    status: 'trial' | 'active' | 'cancelled' | 'expired';
    trialEnd?: string | null;
    planId: PlanType;
    currentPeriodEnd: string;
  };
}

interface PricingPlansProps {
  initialPlanId?: PlanType;
  showAnnual?: boolean;
  className?: string;
}

type LimitKey = keyof PlanLimits;

interface PricingPlanProps {
  name: string;
  price: number;
  features: string[];
  isPopular?: boolean;
  currentPlan?: boolean;
  status?: SubscriptionStatus;
  onSelect: (plan: PlanType) => void;
}

export default function PricingPlans({ initialPlanId, showAnnual = false, className = '' }: PricingPlansProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth() as { user: AuthUser | null; isAuthenticated: boolean };

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

  const plansArray = Object.values(PLANS);

  const renderPlatform = (platform: SocialPlatform, included: boolean) => {
    return (
      <li key={platform} className="flex space-x-3">
        <svg
          className={`flex-shrink-0 h-5 w-5 ${included ? 'text-green-500' : 'text-gray-300'}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
        <span className={`text-sm ${included ? 'text-gray-500' : 'text-gray-300'}`}>
          {PLATFORM_NAMES[platform]}
        </span>
      </li>
    );
  };

  const renderFeature = (feature: PlanFeature) => {
    const formattedFeature = feature.replace(/_/g, ' ');
    return (
      <li key={feature} className="flex space-x-3">
        <svg
          className="flex-shrink-0 h-5 w-5 text-green-500"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-sm text-gray-500 capitalize">
          {formattedFeature}
        </span>
      </li>
    );
  };

  const renderLimit = (plan: Plan, limitName: LimitKey, label: string) => {
    const limit = plan.limits[limitName];
    const value = limit === 'unlimited' ? '∞' : limit;
    return (
      <li key={limitName} className="flex space-x-3">
        <svg
          className="flex-shrink-0 h-5 w-5 text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-sm text-gray-500">
          {value} {label}
        </span>
      </li>
    );
  };

  return (
    <div className={`py-12 bg-gray-50 ${className}`}>
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

            const price = showAnnual ? plan.price.annual : plan.price.monthly;
            const interval = showAnnual ? 'yr' : 'mo';
            const isCurrentPlan = user?.subscription?.planId === plan.id;

            return (
              <div
                key={plan.id}
                className={`border rounded-lg shadow-sm divide-y divide-gray-200 bg-white ${
                  isCurrentPlan ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200'
                }`}
              >
                <div className="p-6">
                  {isCurrentPlan && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-4">
                      Current Plan
                    </span>
                  )}
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {plan.name}
                  </h3>
                  <p className="mt-4 text-sm text-gray-500">{plan.description}</p>
                  <p className="mt-8">
                    <span className="text-4xl font-extrabold text-gray-900">
                      ${price}
                    </span>
                    <span className="text-base font-medium text-gray-500">/{interval}</span>
                  </p>
                  <button
                    onClick={() => handlePlanSelect(plan.id)}
                    disabled={isCurrentPlan}
                    className={`mt-8 block w-full font-semibold py-2 px-4 rounded-md transition duration-150 ease-in-out ${
                      isCurrentPlan
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {plan.id === 'trial' 
                      ? 'Start Free Trial' 
                      : isCurrentPlan 
                        ? 'Current Plan'
                        : 'Get Started'}
                  </button>
                </div>
                <div className="pt-6 pb-8 px-6">
                  <h4 className="text-sm font-medium text-gray-900 tracking-wide uppercase mb-4">
                    Available Platforms
                  </h4>
                  <ul className="mb-6 space-y-4">
                    {BASIC_PLATFORMS.map(platform => 
                      renderPlatform(platform, plan.features.includes(platform))
                    )}
                    {plan.id === 'pro' && (
                      <>
                        <li className="mt-4 mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            Pro Platforms
                          </span>
                        </li>
                        {PRO_PLATFORMS.map(platform =>
                          renderPlatform(platform, plan.features.includes(platform))
                        )}
                      </>
                    )}
                  </ul>
                  <h4 className="text-sm font-medium text-gray-900 tracking-wide uppercase mb-4">
                    Plan Limits
                  </h4>
                  <ul className="mb-6 space-y-4">
                    {renderLimit(plan, 'monthlyPosts', 'posts per month')}
                    {renderLimit(plan, 'scheduledPosts', 'scheduled posts')}
                    {renderLimit(plan, 'teamMembers', 'team members')}
                    {plan.limits.postsPerPlatform && renderLimit(plan, 'postsPerPlatform', 'posts per platform')}
                  </ul>
                  <h4 className="text-sm font-medium text-gray-900 tracking-wide uppercase mb-4">
                    Features
                  </h4>
                  <ul className="space-y-4">
                    {plan.features
                      .filter(feature => !BASIC_PLATFORMS.includes(feature as any) && !PRO_PLATFORMS.includes(feature as any))
                      .map(renderFeature)}
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