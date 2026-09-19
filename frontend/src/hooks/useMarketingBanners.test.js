import assert from 'node:assert/strict';
import test from 'node:test';
import { groupMarketingBanners } from './bannerGrouping.js';

test('public banners group by placement and the lowest priority wins', () => {
  const grouped = groupMarketingBanners([
    { _id: 'b', placement: 'home_hero', priorityOrder: 2 },
    { _id: 'a', placement: 'home_hero', priorityOrder: 1 },
    { _id: 'c', placement: 'top_bar', priorityOrder: 0 }
  ]);
  assert.equal(grouped.home_hero[0]._id, 'a');
  assert.equal(grouped.top_bar[0]._id, 'c');
  assert.deepEqual(grouped.popup, []);
});

test('unknown placements never render', () => {
  assert.equal(groupMarketingBanners([{ placement: 'unknown' }]).home_hero.length, 0);
});
