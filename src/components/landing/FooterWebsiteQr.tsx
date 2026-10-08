import Image from "next/image";
import { Download } from "lucide-react";

/**
 * Footer join-us QR codes (built by `npm run optimize:media`).
 *
 * - With survey → /join-us (shows “How did you hear about this opportunity?”)
 * - Direct apply → /join-us?source=qr (hides that question; channel stored as qr)
 */
const QR_CODES = [
  {
    src: "/balitech-website-qr.png",
    downloadName: "balitech-join-us-qr.png",
    label: "Join Us QR",
    hint: "Asks how they heard about us",
    alt: "QR code for https://balitech.org/join-us",
  },
  {
    src: "/balitech-join-us-direct-qr.png",
    downloadName: "balitech-join-us-direct-qr.png",
    label: "Direct Apply QR",
    hint: "Skips how they heard about us",
    alt: "QR code for https://balitech.org/join-us?source=qr",
  },
] as const;

export default function FooterWebsiteQr() {
  return (
    <div className="footer-website-qr">
      <p className="footer-website-qr__label">Application QR Codes</p>
      <div className="footer-website-qr__grid">
        {QR_CODES.map((qr) => (
          <div key={qr.src} className="footer-website-qr__item">
            <p className="footer-website-qr__item-label">{qr.label}</p>
            <p className="footer-website-qr__hint">{qr.hint}</p>
            <div className="footer-website-qr__row">
              <div className="footer-website-qr__frame">
                <Image
                  src={qr.src}
                  alt={qr.alt}
                  width={112}
                  height={112}
                  className="footer-website-qr__image"
                  unoptimized
                />
              </div>
              <a
                href={qr.src}
                download={qr.downloadName}
                className="footer-website-qr__download"
                aria-label={`Download ${qr.label}`}
                title={`Download ${qr.label}`}
              >
                <Download size={16} aria-hidden />
                <span>Download</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
