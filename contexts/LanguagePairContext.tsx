import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAuth } from "./AuthContext";
import * as languagePairService from "../services/languagePairs";
import type { LanguagePair, CreateLanguagePairPayload } from "../types/languagePair";

const ACTIVE_PAIR_ID_KEY = "flashlingo_active_language_pair_id";

interface LanguagePairContextValue {
  pairs: LanguagePair[];
  activePair: LanguagePair | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  selectPair: (id: number) => void;
  createPair: (payload: CreateLanguagePairPayload) => Promise<LanguagePair>;
  deletePair: (id: number) => Promise<void>;
}

const LanguagePairContext = createContext<LanguagePairContextValue | undefined>(
  undefined
);

export function LanguagePairProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  const [pairs, setPairs] = useState<LanguagePair[]>([]);
  const [activePairId, setActivePairId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyActiveId = useCallback(async (id: number | null) => {
    setActivePairId(id);
    if (id === null) {
      await AsyncStorage.removeItem(ACTIVE_PAIR_ID_KEY);
    } else {
      await AsyncStorage.setItem(ACTIVE_PAIR_ID_KEY, String(id));
    }
  }, []);

  const loadPairs = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetched = await languagePairService.listLanguagePairs();
      setPairs(fetched);

      const storedId = await AsyncStorage.getItem(ACTIVE_PAIR_ID_KEY);
      const storedIdNum = storedId ? Number(storedId) : null;
      const storedStillExists =
        storedIdNum !== null && fetched.some((p) => p.id === storedIdNum);

      if (storedStillExists) {
        setActivePairId(storedIdNum);
      } else {
        // Previously active pair was deleted, or nothing was selected yet
        // — fall back to the first pair so the app always has something
        // to work with as long as the user has at least one pair.
        const fallback = fetched.length > 0 ? fetched[0].id : null;
        await applyActiveId(fallback);
      }
    } finally {
      setIsLoading(false);
    }
  }, [applyActiveId]);

  // Fetch pairs whenever the user logs in; reset everything on logout so
  // a stale list/active pair from a previous session never leaks through.
  useEffect(() => {
    if (isAuthenticated) {
      loadPairs();
    } else {
      setPairs([]);
      setActivePairId(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, loadPairs]);

  const selectPair = useCallback(
    (id: number) => {
      if (pairs.some((p) => p.id === id)) {
        applyActiveId(id);
      }
    },
    [pairs, applyActiveId]
  );

  const createPair = useCallback(
    async (payload: CreateLanguagePairPayload) => {
      const created = await languagePairService.createLanguagePair(payload);
      setPairs((prev) => [...prev, created]);
      // A freshly created pair is almost always what the user wants to
      // work in next, so make it active immediately.
      await applyActiveId(created.id);
      return created;
    },
    [applyActiveId]
  );

  const deletePair = useCallback(
    async (id: number) => {
      await languagePairService.deleteLanguagePair(id);
      setPairs((prev) => {
        const remaining = prev.filter((p) => p.id !== id);
        if (activePairId === id) {
          applyActiveId(remaining.length > 0 ? remaining[0].id : null);
        }
        return remaining;
      });
    },
    [activePairId, applyActiveId]
  );

  const activePair = useMemo(
    () => pairs.find((p) => p.id === activePairId) ?? null,
    [pairs, activePairId]
  );

  const value = useMemo<LanguagePairContextValue>(
    () => ({
      pairs,
      activePair,
      isLoading,
      refresh: loadPairs,
      selectPair,
      createPair,
      deletePair,
    }),
    [pairs, activePair, isLoading, loadPairs, selectPair, createPair, deletePair]
  );

  return (
    <LanguagePairContext.Provider value={value}>
      {children}
    </LanguagePairContext.Provider>
  );
}

export function useLanguagePair(): LanguagePairContextValue {
  const ctx = useContext(LanguagePairContext);
  if (!ctx) {
    throw new Error("useLanguagePair must be used within a LanguagePairProvider");
  }
  return ctx;
}