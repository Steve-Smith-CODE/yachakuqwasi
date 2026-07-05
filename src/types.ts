export interface MascotTip {
  id: string;
  title: string;
  message: string;
  category: "safety" | "budget" | "location" | "academic";
}

export interface HousingListing {
  id: string;
  title: string;
  type: "room" | "apartment" | "shared" | "family";
  pricePen: number;
  distanceToUnschMinutes: number;
  neighborhood: string;
  address: string;
  description: string;
  amenities: string[];
  contactPhone: string;
  landlordName: string;
  verifiedByMaki: boolean;
  images: string[];
  coordinates: { x: number; y: number }; // Relative position on mock Ayacucho map
  status?: "approved" | "pending" | "suspended" | "flagged";
}

export interface Testimonial {
  id: string;
  studentName: string;
  faculty: string;
  content: string;
  rating: number;
}
