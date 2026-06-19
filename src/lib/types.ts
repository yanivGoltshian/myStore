export type Product = {
  id: number;
  name: string;
  model: string;
  price: number;
  regularPrice: number;
  salePrice: number;
  onSale: boolean;
  image: string;
  categoryIds: number[];
  inStock: boolean;
  description: string;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  parent: number;
  count: number;
  icon: string;
  isTop: boolean;
};

export type NavSub = { id: number; name: string; count: number };

export type NavItem = {
  id: number;
  name: string;
  slug: string;
  icon: string;
  count: number;
  subs: NavSub[];
};

export type PromoTile = {
  id: string;
  title: string;
  image: string;
  categoryId: number;
};

export type HomeSection = {
  id: string;
  title: string;
  icon: string;
  categoryId: number;
  limit: number;
  layout: "carousel" | "grid";
};

export type Hero = {
  image: string;
  alt: string;
  href: string;
};

export type Homepage = {
  announcement: string;
  topbarPhone: string;
  hero: Hero;
  promoTiles: PromoTile[];
  sections: HomeSection[];
};

export type OpeningHours = {
  days: string[];
  opens: string;
  closes: string;
};

export type SiteAddress = {
  street: string;
  streetEn: string;
  city: string;
  cityEn: string;
  postalCode: string;
  country: string;
  full: string;
};

export type Site = {
  name: string;
  nameEn: string;
  legalName: string;
  tagline: string;
  url: string;
  phone: string;
  phoneRaw: string;
  whatsapp: string;
  whatsappDisplay: string;
  email: string;
  facebook: string;
  address: SiteAddress;
  hours: string;
  openingHours: OpeningHours[];
};
