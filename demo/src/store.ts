import create from "zustand";

export const useStore = create<{
  active?: "circumcircle" | "convex-hull" | "points";
  setActive: (
    slug: "circumcircle" | "convex-hull" | "points" | undefined
  ) => void;
}>((set) => ({
  active: undefined,
  setActive: (slug) => {
    set({ active: slug });
  },
}));
