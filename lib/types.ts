export const RESIDENT_TYPES = {
  office: "9-to-5 office workers",
  student: "Students",
  dailyWage: "Daily-wage workers",
  other: "Other",
} as const;

export const REGIONS = {
  south: "South Indian",
  north: "North Indian",
  east: "East / North-east",
  west: "West Indian",
  other: "Other",
} as const;

export const SHARING = { 1: "Single room", 2: "2 sharing", 3: "3 sharing", 4: "4 sharing", 5: "5+ sharing" } as const;

export const AMENITIES = ["Wi-Fi", "AC", "Hot water", "Power backup", "Laundry", "Housekeeping", "CCTV", "Fridge", "Parking"] as const;

export const CUISINES = ["South Indian", "North Indian", "Bengali", "Gujarati", "Other"] as const;

export type Percent<K extends string> = Record<K, number>;

export interface ReviewInput {
  sharing: 1 | 2 | 3 | 4 | 5; // the sharing type the reviewer lives in
  rentPaid: number; // per month, for that sharing type
  deposit: number; // refundable security deposit, 0 if none
  foodIncluded: boolean; // is food part of the rent?
  extraCharges: boolean; // electricity / water / maintenance billed on top?
  amenities: string[];
  residentTypes: Percent<keyof typeof RESIDENT_TYPES>; // sums to 100
  community: Percent<keyof typeof REGIONS>; // sums to 100
  cuisines: string[];
  menuAvailable: boolean;
  ratings: { cleanliness: number; food: number; ambience: number; value: number }; // 1-5
  text: string;
  images: string[];
}

export const emptyReview = (): ReviewInput => ({
  sharing: 2,
  rentPaid: 0,
  deposit: 0,
  foodIncluded: true,
  extraCharges: false,
  amenities: [],
  residentTypes: { office: 0, student: 0, dailyWage: 0, other: 0 },
  community: { south: 0, north: 0, east: 0, west: 0, other: 0 },
  cuisines: [],
  menuAvailable: false,
  ratings: { cleanliness: 3, food: 3, ambience: 3, value: 3 },
  text: "",
  images: [],
});

const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);

// Returns an error message, or null if valid.
export function validateReview(r: ReviewInput): string | null {
  if (![1, 2, 3, 4, 5].includes(r.sharing)) return "Pick your sharing type.";
  if (!(r.rentPaid > 0)) return "Enter the monthly rent you pay for your sharing type.";
  if (r.deposit < 0) return "Deposit cannot be negative.";
  if (sum(r.residentTypes) !== 100) return "Resident types must add up to 100%.";
  if (sum(r.community) !== 100) return "Community mix must add up to 100%.";
  if (r.cuisines.length === 0) return "Pick at least one cuisine.";
  for (const v of Object.values(r.ratings)) if (!(v >= 1 && v <= 5)) return "Ratings must be 1 to 5.";
  if (r.text.trim().length < 20) return "Write at least a couple of sentences about living here.";
  return null;
}
