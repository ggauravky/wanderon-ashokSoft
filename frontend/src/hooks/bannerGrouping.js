export const BANNER_PLACEMENTS = ['home_hero', 'top_bar', 'destination_highlight', 'offer_strip', 'popup'];

export const groupMarketingBanners = (banners = []) => {
  const grouped = Object.fromEntries(BANNER_PLACEMENTS.map((placement) => [placement, []]));
  for (const banner of banners) {
    if (grouped[banner?.placement]) grouped[banner.placement].push(banner);
  }
  for (const placement of BANNER_PLACEMENTS) grouped[placement].sort((a, b) => (a.priorityOrder ?? 1) - (b.priorityOrder ?? 1) || new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  return grouped;
};
