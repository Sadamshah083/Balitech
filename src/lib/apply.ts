export function getCampaignApplyHref(
  campaignTitle: string,
  pathname: string = "/"
) {
  const base = pathname === "/services" ? "/services" : "/";
  return `${base}?campaign=${encodeURIComponent(campaignTitle)}#contact`;
}

export function getCampaignFromSearch(search: string) {
  const value = new URLSearchParams(search).get("campaign");
  return value ? decodeURIComponent(value) : null;
}
