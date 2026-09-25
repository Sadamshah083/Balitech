import Image from "next/image";
import { Download } from "lucide-react";

/**
 * The footer's QR code for balitech.org.
 *
 * The code is built once by `npm run optimize:media` (see `buildQr` there),
 * because it encodes a single URL that never changes. Generating it in the
 * browser instead meant shipping the `qrcode` library as a 59 KB client chunk
 * and spending 579 ms of main thread drawing it to a canvas on a throttled
 * phone — a quarter of all the JavaScript the home page ran, for an image
 * 15,000px below the fold that is byte-identical on every visit.
 *
 * As a static file it also fixes two smaller things: the code is there in the
 * first paint rather than popping in after hydration, and the download works
 * without JavaScript.
 */
const QR_SRC = "/balitech-website-qr.png";
const DOWNLOAD_NAME = "balitech-website-qr.png";

export default function FooterWebsiteQr() {
  return (
    <div className="footer-website-qr">
      <p className="footer-website-qr__label">Website QR Code</p>
      <div className="footer-website-qr__row">
        <div className="footer-website-qr__frame">
          <Image
            src={QR_SRC}
            alt="QR code for https://balitech.org"
            width={112}
            height={112}
            className="footer-website-qr__image"
            unoptimized
          />
        </div>
        <a
          href={QR_SRC}
          download={DOWNLOAD_NAME}
          className="footer-website-qr__download"
          aria-label="Download website QR code"
          title="Download QR code"
        >
          <Download size={16} aria-hidden />
          <span>Download</span>
        </a>
      </div>
    </div>
  );
}
