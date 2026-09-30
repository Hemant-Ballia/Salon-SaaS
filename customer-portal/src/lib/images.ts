/**
 * Curated Realistic Photography Strategy
 * High-resolution, professional, editorial imagery specifically matched
 * to salon, wellness, barbershop, beauty, and automotive care categories.
 */

// Category curated imagery (used for category tiles, business covers, and default fallbacks)
export const CATEGORY_IMAGES: Record<string, { cover: string; thumbnail: string; alt: string }> = {
  HAIR: {
    cover: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=85",
    thumbnail: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80",
    alt: "Modern minimalist hair salon interior with styling chairs",
  },
  BARBER: {
    cover: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=85",
    thumbnail: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80",
    alt: "Premium gentleman barber studio with leather chairs",
  },
  BEAUTY: {
    cover: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=85",
    thumbnail: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80",
    alt: "Bright luxury beauty aesthetics studio and makeup lounge",
  },
  SPA: {
    cover: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=85",
    thumbnail: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80",
    alt: "Zen luxury wellness spa with ambient lighting and treatment tables",
  },
  NAILS: {
    cover: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=1200&q=85",
    thumbnail: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=400&q=80",
    alt: "Clean boutique manicure and nail design bar",
  },
  CAR_WASH: {
    cover: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1200&q=85",
    thumbnail: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=400&q=80",
    alt: "High-end auto detailing and ceramic coating bay",
  },
  DEFAULT: {
    cover: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=85",
    thumbnail: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=400&q=80",
    alt: "Modern boutique salon studio interior",
  },
};

// Hero lifestyle background image
export const HERO_LIFESTYLE_IMAGE =
  "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1400&q=85";

// Service type photographic mapping
export function getServiceFallbackImage(serviceName?: string, categoryName?: string): string {
  const text = `${serviceName || ""} ${categoryName || ""}`.toLowerCase();

  if (text.includes("haircut") || text.includes("cut") || text.includes("trim") || text.includes("styling")) {
    return "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80";
  }
  if (text.includes("beard") || text.includes("shave") || text.includes("fade") || text.includes("mustache")) {
    return "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&q=80";
  }
  if (text.includes("color") || text.includes("highlights") || text.includes("balayage") || text.includes("dye")) {
    return "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=600&q=80";
  }
  if (text.includes("facial") || text.includes("skin") || text.includes("cleanse") || text.includes("glow")) {
    return "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80";
  }
  if (text.includes("manicure") || text.includes("nail") || text.includes("pedicure") || text.includes("gel")) {
    return "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=600&q=80";
  }
  if (text.includes("massage") || text.includes("spa") || text.includes("therapy") || text.includes("relax")) {
    return "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80";
  }
  if (text.includes("wash") || text.includes("detail") || text.includes("car") || text.includes("ceramic")) {
    return "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=600&q=80";
  }

  // Default professional salon service image
  return "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=600&q=80";
}

// Business cover photographic mapping
export function getBusinessCoverImage(business?: { businessType?: string; name?: string; slug?: string }): string {
  const type = (business?.businessType || "").toUpperCase();
  const name = (business?.name || "").toLowerCase();

  if (type.includes("CAR") || name.includes("car") || name.includes("wash") || name.includes("auto")) {
    return CATEGORY_IMAGES.CAR_WASH.cover;
  }
  if (type.includes("BARBER") || name.includes("barber") || name.includes("fade")) {
    return CATEGORY_IMAGES.BARBER.cover;
  }
  if (type.includes("SPA") || name.includes("spa") || name.includes("wellness")) {
    return CATEGORY_IMAGES.SPA.cover;
  }
  if (type.includes("BEAUTY") || name.includes("parlour") || name.includes("beauty")) {
    return CATEGORY_IMAGES.BEAUTY.cover;
  }
  if (type.includes("NAIL") || name.includes("nail")) {
    return CATEGORY_IMAGES.NAILS.cover;
  }
  if (type.includes("SALON") || name.includes("salon") || name.includes("hair")) {
    return CATEGORY_IMAGES.HAIR.cover;
  }

  return CATEGORY_IMAGES.DEFAULT.cover;
}

// Staff portrait fallbacks
const STAFF_PORTRAITS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
];

export function getStaffAvatarUrl(name?: string, id?: string): string {
  if (!name && !id) return STAFF_PORTRAITS[0];
  const hashStr = (id || name || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return STAFF_PORTRAITS[hashStr % STAFF_PORTRAITS.length];
}
