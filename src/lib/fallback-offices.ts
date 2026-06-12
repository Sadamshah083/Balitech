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

function mapUrl(address: string) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&hl=en&z=14&output=embed`;
}

export const fallbackOffices: PublicOffice[] = [
  {
    id: "head-office",
    name: "Head Office",
    slug: "head-office",
    address:
      "Office 8, 1st Floor, Maryam Business Centre, Murree Road, Shamsabad, Rawalpindi, Punjab 4400",
    phone: "0331 8638312",
    email: "info@balitech.com",
    hours: "Mon – Sat: 9:00 AM – 6:00 PM",
    city: "Rawalpindi",
    country: "Pakistan",
    image: "/balitech_office/DSC03829.JPG",
    mapEmbedUrl: mapUrl(
      "Maryam Business Centre, Murree Road, Shamsabad, Rawalpindi"
    ),
    order: 1,
    isHeadOffice: true,
  },
  {
    id: "islamabad-office",
    name: "Islamabad Office",
    slug: "islamabad-office",
    address: "Plot No.349-352 street No 5 industrial Area 1-9/3, Islamabad",
    phone: "0331 8638312",
    email: "info@balitech.com",
    hours: "Mon – Sat: 9:00 AM – 6:00 PM",
    city: "Islamabad",
    country: "Pakistan",
    image: "/balitech_office/DSC03814.JPG",
    mapEmbedUrl: mapUrl("Plot 349-352 Street 5 I-9/3 Industrial Area Islamabad"),
    order: 2,
    isHeadOffice: false,
  },
  {
    id: "commercial-office",
    name: "Commercial Office",
    slug: "commercial-office",
    address:
      "Office No 1, 3rd Floor, Satellite Town B Block, Ideas Building Plaza Rwp",
    phone: "0331 8638312",
    email: "info@balitech.com",
    hours: "Mon – Sat: 9:00 AM – 6:00 PM",
    city: "Rawalpindi",
    country: "Pakistan",
    image: "/gallery/gallery-office-workplace-1.jpg",
    mapEmbedUrl: mapUrl("Ideas Building Plaza Satellite Town B Block Rawalpindi"),
    order: 3,
    isHeadOffice: false,
  },
  {
    id: "iran-road-office",
    name: "Iran Road Office",
    slug: "iran-road-office",
    address:
      "Plaza No A-74, Iran Road Satellite Town-A Rawalpindi Punjab Pakistan",
    phone: "0331 8638312",
    email: "info@balitech.com",
    hours: "Mon – Sat: 9:00 AM – 6:00 PM",
    city: "Rawalpindi",
    country: "Pakistan",
    image: "/gallery/gallery-office-workplace-2.jpg",
    mapEmbedUrl: mapUrl("Plaza A-74 Iran Road Satellite Town-A Rawalpindi"),
    order: 4,
    isHeadOffice: false,
  },
];
