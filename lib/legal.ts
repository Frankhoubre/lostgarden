export const LEGAL_PUBLISHER = {
  name: "Frank Houbre",
  project: "Lost Garden",
  address: "ZA les terrasses de la sarre 4",
  postalCode: "57400",
  city: "Sarrebourg",
  country: "France",
  email: "hellobusinessdynamite@gmail.com",
} as const;

export const LEGAL_HOSTS = [
  {
    name: "Vercel Inc.",
    role: "Website hosting and delivery",
    address: "340 S Lemon Ave #4133, Walnut, CA 91789, United States",
    website: "https://vercel.com",
  },
  {
    name: "Hostinger",
    role: "Domain name and related services",
    address:
      "Hostinger International Ltd., 61 Lordou Vironos Street, 6023 Larnaca, Cyprus",
    website: "https://www.hostinger.com",
  },
  {
    name: "Google Firebase (Google Cloud)",
    role: "Authentication, database, and application services",
    address:
      "Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland",
    website: "https://firebase.google.com",
  },
] as const;

export const COOKIE_CONSENT_KEY = "lostgarden-cookie-consent";

export type CookieConsent = "accepted" | "rejected";
