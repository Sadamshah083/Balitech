import { Suspense } from "react";
import SitePage from "@/components/layout/SitePage";
import ThankYouContent, {
  ThankYouView,
} from "@/components/thank-you/ThankYouContent";
import { pageMetadata } from "@/lib/seo";

export const metadata = {
  ...pageMetadata({
    title: "Thank You",
    description:
      "Thank you for contacting BALITECH. Our team has received your submission.",
    path: "/thank-you",
  }),
  /* A funnel step, not a landing page: keep it out of search results. */
  robots: { index: false, follow: true },
};

export default function ThankYouPage() {
  return (
    <SitePage>
      {/* The form type is read from the query string on the client, so the
          page itself stays static; the fallback is the generic message. */}
      <Suspense fallback={<ThankYouView form={null} />}>
        <ThankYouContent />
      </Suspense>
    </SitePage>
  );
}
