import { useCallback, useEffect, useState } from 'react';

import { getProfile, type Profile } from '@/lib/api';

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await getProfile();
    setProfile(data);
    return data;
  }, []);

  useEffect(() => {
    let cancelled = false;

    getProfile().then((data) => {
      if (cancelled) return;
      setProfile(data);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { profile, isLoading, refresh, setProfile };
}
