import subcatsData from "@/data/lighting-subcats.json";

export type LightingProduct = {
  id: number;
  name: string;
  model: string;
  price: number;
  image: string;
  inStock: boolean;
  description: string;
};

export type LightingSubcat = {
  id: number;
  name: string;
  count: number;
  thumb: string;
};

export const lightingSubcats = subcatsData as LightingSubcat[];

export const LIGHTING_TOP = { id: 9000, name: "תאורה", href: "/lighting/" };

// Offset so lighting ids never collide with the main store cart ids.
export const LIGHTING_ID_OFFSET = 100_000_000;

export function getLightingSubcat(id: number): LightingSubcat | undefined {
  return lightingSubcats.find((s) => s.id === id);
}

export function formatLightingPrice(price: number): string {
  return "₪" + price.toLocaleString("he-IL", { maximumFractionDigits: 2 });
}
