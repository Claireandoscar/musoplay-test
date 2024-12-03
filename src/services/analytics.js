export const trackEvent = (eventName, properties = {}) => {
    try {
      // Log to console in development
      console.log('Event tracked:', eventName, properties);
      
      // Send to Microsoft Clarity if available
      if (window.clarity) {
        window.clarity("event", eventName, properties);
      }
    } catch (error) {
      console.error('Analytics Error:', error);
    }
  };