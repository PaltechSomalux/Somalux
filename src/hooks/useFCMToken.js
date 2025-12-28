// Cloud Messaging disabled - push notifications removed
import { useState } from 'react';

export const useFCMToken = () => {
  const [token, setToken] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  // No-op hook - functionality disabled
  return { token, isSupported };
};