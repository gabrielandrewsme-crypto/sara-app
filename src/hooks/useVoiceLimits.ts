import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';

const FREE_MONTHLY_SEC = 40 * 60;
const PREMIUM_MONTHLY_SEC = Number.POSITIVE_INFINITY;
const PER_INTERACTION_SEC = 2 * 60;
const STORAGE_PREFIX = 'sara_voice_usage_';

function monthKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${STORAGE_PREFIX}${y}-${m}`;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

export type VoiceLimits = {
  isPremium: boolean;
  monthlyLimitSec: number;
  perInteractionLimitSec: number;
  monthlyUsedSec: number;
  monthlyRemainingSec: number;
  monthlyPercent: number;
  loaded: boolean;
  recordSession: (seconds: number) => Promise<void>;
  reload: () => Promise<void>;
};

export function useVoiceLimits(): VoiceLimits {
  const { isPremium } = useAuth();
  const [usedSec, setUsedSec] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(monthKey());
      const parsed = raw ? Number(raw) : 0;
      setUsedSec(Number.isFinite(parsed) ? parsed : 0);
    } catch {
      setUsedSec(0);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const recordSession = useCallback(
    async (seconds: number) => {
      if (!Number.isFinite(seconds) || seconds <= 0) return;
      const next = usedSec + Math.round(seconds);
      setUsedSec(next);
      try {
        await AsyncStorage.setItem(monthKey(), String(next));
      } catch {
        // ignore storage failure — counter still in memory
      }
    },
    [usedSec],
  );

  const monthlyLimitSec = isPremium ? PREMIUM_MONTHLY_SEC : FREE_MONTHLY_SEC;
  const monthlyRemainingSec = isPremium
    ? Number.POSITIVE_INFINITY
    : Math.max(0, monthlyLimitSec - usedSec);
  const monthlyPercent = isPremium
    ? 0
    : clampPercent((usedSec / monthlyLimitSec) * 100);

  return {
    isPremium,
    monthlyLimitSec,
    perInteractionLimitSec: PER_INTERACTION_SEC,
    monthlyUsedSec: usedSec,
    monthlyRemainingSec,
    monthlyPercent,
    loaded,
    recordSession,
    reload,
  };
}

export function formatSeconds(total: number): string {
  if (!Number.isFinite(total) || total < 0) return '0:00';
  const t = Math.round(total);
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
