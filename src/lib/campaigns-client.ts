"use client";

export type ClientCampaign = {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  locations?: string[] | null;
  location?: string | null;
};

let inFlight: Promise<ClientCampaign[]> | null = null;

/**
 * The public campaign list, fetched once per page load.
 *
 * Two components on /join-us need it — the campaign carousel and the apply
 * form, which narrows its branch list to the campaign being applied to — and
 * asking twice for the same rows is one request more than the page needs.
 *
 * Both read it on the client rather than from props on purpose: the pages are
 * prerendered, so a campaign added or edited in the admin panel would
 * otherwise not appear until the next deploy.
 */
export function fetchPublicCampaigns(): Promise<ClientCampaign[]> {
  if (!inFlight) {
    inFlight = fetch("/api/campaigns?public=true")
      .then((res) => (res.ok ? res.json() : { campaigns: [] }))
      .then((data) => (Array.isArray(data.campaigns) ? data.campaigns : []))
      .catch(() => []);
  }

  return inFlight;
}
