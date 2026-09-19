import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { TouchData } from "@/lib/attribution";

/** First-touch attribution window. Older first-touches are replaced, not extended. */
const FIRST_TOUCH_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

interface AttributionState {
  /** What originally found this customer. */
  first: TouchData | null;
  /** What brought them back for the visit in which they ordered. */
  last: TouchData | null;
  /** Epoch ms when `first` was recorded, used to expire the 30-day window. */
  firstSetAt: number | null;
  /** Record a resolved touch. Callers pass null for internal navigation. */
  record: (touch: TouchData | null) => void;
  /** Payload sent with an order. */
  getAttribution: () => { first: TouchData | null; last: TouchData | null };
}

export const useAttributionStore = create<AttributionState>()(
  persist(
    (set, get) => ({
      first: null,
      last: null,
      firstSetAt: null,

      record: (touch) => {
        if (!touch) return;

        const { first, firstSetAt } = get();
        const now = Date.now();
        const firstExpired =
          firstSetAt == null || now - firstSetAt > FIRST_TOUCH_WINDOW_MS;

        set({
          // First-touch is write-once within the window.
          first: first == null || firstExpired ? touch : first,
          firstSetAt: first == null || firstExpired ? now : firstSetAt,
          // Last-touch always reflects the most recent genuine external touch.
          last: touch,
        });
      },

      getAttribution: () => {
        const { first, last } = get();
        return { first, last };
      },
    }),
    {
      name: "maneel-attribution",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
