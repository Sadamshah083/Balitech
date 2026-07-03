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

export const officePhonePrimary = "0370 0585660";
export const officePhoneSecondary = "0327 1233435";
export const officePhoneDisplay = `${officePhonePrimary} / ${officePhoneSecondary}`;

export const removedOfficeSlugs = new Set<string>();

function mapUrl(address: string) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&hl=en&z=14&output=embed`;
}

export const fallbackOffices: PublicOffice[] = [
  {
    id: "shamsabad-office",
    name: "Shamsabad Office",
    slug: "shamsabad-office",
    address:
      "Office 8, 1st Floor, Maryam Business Centre, Murree Road, Shamsabad, Rawalpindi, Punjab 4400",
    phone: officePhoneDisplay,
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
    id: "islamabad-office",
    name: "Islamabad Office",
    slug: "islamabad-office",
    address: "Plot No.349-352 street No 5 industrial Area 1-9/3, Islamabad",
    phone: officePhoneDisplay,
    email: "info@balitech.com",
    hours: officeHours,
    city: "Islamabad",
    country: "Pakistan",
    image: null,
    mapEmbedUrl: mapUrl("Plot No.349-352 street No 5 industrial Area 1-9/3, Islamabad"),
    order: 2,
    isHeadOffice: false,
  },
  {
    id: "commercial-office",
    name: "Commercial Office",
    slug: "commercial-office",
    address:
      "Office No 1, 3rd Floor, Satellite Town B Block, Ideas Building Plaza Rwp",
    phone: officePhoneDisplay,
    email: "info@balitech.com",
    hours: officeHours,
    city: "Rawalpindi",
    country: "Pakistan",
    image: null,
    mapEmbedUrl: mapUrl("Ideas Building Plaza Satellite Town B Block Rawalpindi"),
    order: 3,
    isHeadOffice: false,
  },
  {
    id: "iran-road-office",
    name: "Iran Road Office",
    slug: "iran-road-office",
    address: "Plaza No A-74, Iran Road Satellite Town-A Rawalpindi Punjab Pakistan",
    phone: officePhoneDisplay,
    email: "info@balitech.com",
    hours: officeHours,
    city: "Rawalpindi",
    country: "Pakistan",
    image: null,
    mapEmbedUrl: mapUrl("Plaza No A-74, Iran Road Satellite Town-A Rawalpindi"),
    order: 4,
    isHeadOffice: false,
  },
];
