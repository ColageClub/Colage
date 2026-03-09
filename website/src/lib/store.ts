// In-memory store for dev mode — replace with DynamoDB later

export interface Business {
  id: string;
  email: string;
  name: string;
  address: string;
  category: string;
  logoUrl: string | null;
  createdAt: string;
}

export interface Ad {
  id: string;
  businessId: string;
  schools: string[];
  businessName: string;
  bio: string;
  deal: string;
  logoUrl: string | null;
  dailyBudget: number;
  status: "active" | "paused" | "pending";
  impressions: number;
  taps: number;
  totalSpend: number;
  createdAt: string;
}

// Dev mode in-memory data
const businesses: Map<string, Business> = new Map();
const ads: Map<string, Ad> = new Map();

// Seed some demo data
const demoBusiness: Business = {
  id: "demo-biz-1",
  email: "owner@bluebrew.com",
  name: "Blue Brew Coffee",
  address: "123 S State St, Ann Arbor, MI",
  category: "Food & Drink",
  logoUrl: null,
  createdAt: new Date().toISOString(),
};
businesses.set(demoBusiness.id, demoBusiness);

const demoAd: Ad = {
  id: "demo-ad-1",
  businessId: "demo-biz-1",
  schools: ["umich.edu"],
  businessName: "Blue Brew Coffee",
  bio: "Student-favorite coffee shop since 2019",
  deal: "15% off any drink — show this ad",
  logoUrl: null,
  dailyBudget: 5,
  status: "active",
  impressions: 1247,
  taps: 89,
  totalSpend: 34.5,
  createdAt: new Date().toISOString(),
};
ads.set(demoAd.id, demoAd);

export const store = {
  // Business
  getBusiness(id: string) { return businesses.get(id) || null; },
  getBusinessByEmail(email: string) { return [...businesses.values()].find(b => b.email === email) || null; },
  createBusiness(biz: Business) { businesses.set(biz.id, biz); return biz; },
  updateBusiness(id: string, updates: Partial<Business>) {
    const biz = businesses.get(id);
    if (!biz) return null;
    const updated = { ...biz, ...updates };
    businesses.set(id, updated);
    return updated;
  },

  // Ads
  getAd(id: string) { return ads.get(id) || null; },
  getAdsByBusiness(businessId: string) { return [...ads.values()].filter(a => a.businessId === businessId); },
  getAdsBySchool(school: string) { return [...ads.values()].filter(a => a.status === "active" && a.schools.includes(school)); },
  createAd(ad: Ad) { ads.set(ad.id, ad); return ad; },
  updateAd(id: string, updates: Partial<Ad>) {
    const ad = ads.get(id);
    if (!ad) return null;
    const updated = { ...ad, ...updates };
    ads.set(id, updated);
    return updated;
  },
  deleteAd(id: string) { ads.delete(id); },

  // Ad serving — weighted random by daily budget
  serveAd(school: string): Ad | null {
    const schoolAds = this.getAdsBySchool(school);
    if (schoolAds.length === 0) return null;

    const totalBudget = schoolAds.reduce((sum, a) => sum + a.dailyBudget, 0);
    let random = Math.random() * totalBudget;

    for (const ad of schoolAds) {
      random -= ad.dailyBudget;
      if (random <= 0) {
        // Track impression
        ad.impressions++;
        return ad;
      }
    }
    return schoolAds[0];
  },

  trackTap(adId: string) {
    const ad = ads.get(adId);
    if (ad) ad.taps++;
  },

  // Available schools
  getSchools() {
    return [
      { domain: "umich.edu", name: "University of Michigan", students: 847, city: "Ann Arbor, MI" },
      { domain: "harvard.edu", name: "Harvard University", students: 512, city: "Cambridge, MA" },
      { domain: "stanford.edu", name: "Stanford University", students: 623, city: "Stanford, CA" },
    ];
  },
};
