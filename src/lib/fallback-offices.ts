export type PublicOffice = {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string | null;
  email: string | null;
  hours: string | null;
  city: string | null;
  country: string;
  image: string | null;
  mapEmbedUrl: string | null;
  order: number;
  isHeadOffice: boolean;
};

export const officeHours = "Mon - Fri from 6 Pm to 4 oclock";

export const removedOfficeSlugs = new Set([
  "islamabad-office",
  "iran-road-office",
]);

function mapUrl(address: string) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&hl=en&z=14&output=embed`;
}

export const fallbackOffices: PublicOffice[] = [
  {
    id: "maryam-business-centre",
    name:
      "Office 8, 1st Floor, Maryam Business Centre, Murree Road, Shamsabad, Rawalpindi, Punjab 4400",
    slug: "maryam-business-centre",
    address:
      "Office 8, 1st Floor, Maryam Business Centre, Murree Road, Shamsabad, Rawalpindi, Punjab 4400",
    phone: "0331 8638312",
    email: "info@balitech.com",
    hours: officeHours,
    city: "Rawalpindi",
    country: "Pakistan",
    image: null,
    mapEmbedUrl: mapUrl(
      "Office 8, Maryam Business Centre, Murree Road, Shamsabad, Rawalpindi, Punjab 4400"
    ),
    order: 1,
    isHeadOffice: true,
  },
  {
    id: "ideas-building-plaza",
    name: "Ideas Building Plaza — Satellite Town B Block",
    slug: "ideas-building-plaza",
    address:
      "Office No 1, 3rd Floor, Satellite Town B Block, Ideas Building Plaza Rwp",
    phone: "0331 8638312",
    email: "info@balitech.com",
    hours: officeHours,
    city: "Rawalpindi",
    country: "Pakistan",
    image: null,
    mapEmbedUrl: mapUrl("Ideas Building Plaza Satellite Town B Block Rawalpindi"),
    order: 2,
    isHeadOffice: false,
  },
];
