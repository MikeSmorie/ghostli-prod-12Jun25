import { useEffect, useState } from "react";
import { useLocation } from "wouter";

interface ReferralData {
  referralCode?: string;
  source?: string;
  campaign?: string;
}

export function useReferralTracking() {
  const [location] = useLocation();
  const [referralData, setReferralData] = useState<ReferralData>({});

  useEffect(() => {
    // Parse URL parameters for referral tracking
    const urlParams = new URLSearchParams(window.location.search);
    
    const trackingData: ReferralData = {
      referralCode: urlParams.get('ref') || undefined,
      source: urlParams.get('utm_source') || undefined,
      campaign: urlParams.get('utm_campaign') || undefined,
    };

    // Store referral data in session storage for persistence during registration
    if (trackingData.referralCode || trackingData.source || trackingData.campaign) {
      sessionStorage.setItem('ghostli_referral_data', JSON.stringify(trackingData));
      setReferralData(trackingData);
    } else {
      // Check if we have stored referral data
      const storedData = sessionStorage.getItem('ghostli_referral_data');
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          setReferralData(parsed);
        } catch (error) {
          console.error('Error parsing stored referral data:', error);
        }
      }
    }
  }, [location]);

  const clearReferralData = () => {
    sessionStorage.removeItem('ghostli_referral_data');
    setReferralData({});
  };

  const getReferralDataForRegistration = () => {
    return referralData;
  };

  return {
    referralData,
    clearReferralData,
    getReferralDataForRegistration,
    hasReferral: !!(referralData.referralCode || referralData.source)
  };
}