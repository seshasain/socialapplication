import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, trackEvent, setUserProperties } from '../utils/analytics';
import { useAuth } from '../context/AuthContext';

export function useAnalytics() {
  const location = useLocation();
  const { user } = useAuth();

  // Track page views
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  // Track user properties when user changes
  useEffect(() => {
    if (user) {
      setUserProperties({
        userId: user.id,
        userRole: user.role,
        subscriptionPlan: user.subscription?.planId,
        hasConnectedAccounts: user.socialAccounts?.length > 0,
      });
    }
  }, [user]);

  // Utility function to track events with user context
  const trackEventWithUser = useCallback((
    eventName: string,
    eventParams?: { [key: string]: any }
  ) => {
    trackEvent(eventName, {
      ...eventParams,
      userId: user?.id,
      userRole: user?.role,
      subscriptionPlan: user?.subscription?.planId,
    });
  }, [user]);

  return { trackEvent: trackEventWithUser };
}