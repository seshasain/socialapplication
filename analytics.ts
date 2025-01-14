// Google Analytics
declare global {
    interface Window {
      gtag: (...args: any[]) => void;
      dataLayer: any[];
    }
  }
  
  export const initGA = () => {
    const gaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    
    if (!gaMeasurementId) {
      console.warn('Google Analytics Measurement ID not found');
      return;
    }
  
    // Add Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`;
    document.head.appendChild(script);
  
    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', gaMeasurementId, {
      page_path: window.location.pathname,
    });
  };
  
  // Track page views
  export const trackPageView = (path: string) => {
    if (!window.gtag) return;
    
    window.gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID, {
      page_path: path,
    });
  };
  
  // Track events
  export const trackEvent = (
    eventName: string,
    eventParams?: { [key: string]: any }
  ) => {
    if (!window.gtag) return;
  
    window.gtag('event', eventName, eventParams);
  };
  
  // Track user properties
  export const setUserProperties = (properties: { [key: string]: any }) => {
    if (!window.gtag) return;
  
    window.gtag('set', 'user_properties', properties);
  };
  
  // Track exceptions
  export const trackException = (description: string, fatal: boolean = false) => {
    if (!window.gtag) return;
  
    window.gtag('event', 'exception', {
      description,
      fatal,
    });
  };
  
  // Track user timing
  export const trackTiming = (
    name: string,
    value: number,
    category?: string,
    label?: string
  ) => {
    if (!window.gtag) return;
  
    window.gtag('event', 'timing_complete', {
      name,
      value,
      event_category: category,
      event_label: label,
    });
  };
  
  // Hotjar
  export const initHotjar = () => {
    const hotjarId = import.meta.env.VITE_HOTJAR_ID;
    const hotjarVersion = import.meta.env.VITE_HOTJAR_VERSION;
  
    if (!hotjarId || !hotjarVersion) {
      console.warn('Hotjar configuration not found');
      return;
    }
  
    (function(h: any,o: any,t: any,j: any,a?: any,r?: any){
      h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
      h._hjSettings={hjid: hotjarId,hjsv: hotjarVersion};
      a=o.getElementsByTagName('head')[0];
      r=o.createElement('script');r.async=1;
      r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
      a.appendChild(r);
    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
  };
  
  // Identify Hotjar User
  export const identifyHotjarUser = (userId: string, userProperties?: { [key: string]: any }) => {
    if (!(window as any).hj) return;
  
    (window as any).hj('identify', userId, userProperties);
  };
  
  // Track Hotjar events
  export const trackHotjarEvent = (eventName: string) => {
    if (!(window as any).hj) return;
  
    (window as any).hj('event', eventName);
  };