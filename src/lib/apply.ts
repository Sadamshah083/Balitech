export function getCampaignApplyHref(campaignTitle: string) {
  return `/join-us?campaign=${encodeURIComponent(campaignTitle)}#apply`;
}

export function getCampaignFromSearch(search: string) {
  const value = new URLSearchParams(search).get("campaign");
  return value ? decodeURIComponent(value) : null;
}
