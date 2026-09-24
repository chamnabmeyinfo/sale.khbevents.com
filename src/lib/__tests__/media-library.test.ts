import { describe, expect, it } from 'vitest';
import { cleanLabel, findUsage, isUploadName, labelFor, matchesSearch, normalizeMediaMeta, readableName, withLabel, withoutFile } from '../media-library';

const NAME = 'mfk2x1a-0a1b2c3d-coffee-beans.webp';

describe('media library names', () => {
  it('accepts only names the upload route creates', () => {
    expect(isUploadName(NAME)).toBe(true);
    expect(isUploadName('../db.json')).toBe(false);
    expect(isUploadName('photo.svg')).toBe(false);
    expect(isUploadName('Upper.jpg')).toBe(false);
  });

  it('turns storage names into readable names', () => {
    expect(readableName(NAME)).toBe('Coffee beans');
    expect(labelFor(NAME, {})).toBe('Coffee beans');
    expect(labelFor(NAME, { [NAME]: { label: 'Hero – beans' } })).toBe('Hero – beans');
  });

  it('cleans labels and drops bad entries', () => {
    expect(cleanLabel('  a   b ')).toBe('a b');
    expect(cleanLabel('x'.repeat(200))).toHaveLength(80);
    expect(normalizeMediaMeta({ [NAME]: { label: ' Beans ' }, '../x.jpg': { label: 'bad' }, 'ok-1.jpg': { label: '' } })).toEqual({ [NAME]: { label: 'Beans' } });
    expect(normalizeMediaMeta(['nope'])).toEqual({});
  });

  it('renames and clears without mutating', () => {
    const meta = {};
    const renamed = withLabel(meta, NAME, 'Beans');
    expect(meta).toEqual({});
    expect(renamed).toEqual({ [NAME]: { label: 'Beans' } });
    expect(withLabel(renamed, NAME, '   ')).toEqual({});
    expect(withoutFile(renamed, NAME)).toEqual({});
    expect(withoutFile(renamed, 'other-1.jpg')).toBe(renamed);
  });
});

describe('findUsage', () => {
  it('lists the pages and popups that contain the photo', () => {
    const pages = [
      { id: 'p1', title: 'Coffee', slug: 'coffee', builder: { blocks: [{ image: `https://x.supabase.co/storage/v1/object/public/page-images/${NAME}` }] } },
      { id: 'p2', title: 'Other', slug: 'other' },
    ];
    const popups = [{ id: 'a1', name: 'Early bird', title: { en: 'Hi' }, imageUrl: `/api/uploads/${NAME}` }];
    expect(findUsage(NAME, pages, popups)).toEqual([
      { kind: 'page', id: 'p1', title: 'Coffee', slug: 'coffee' },
      { kind: 'popup', id: 'a1', title: 'Early bird' },
    ]);
    expect(findUsage('unused-1.jpg', pages, popups)).toEqual([]);
  });

  it('searches by display name or file name', () => {
    expect(matchesSearch({ name: NAME, label: 'Hero shot' }, 'hero')).toBe(true);
    expect(matchesSearch({ name: NAME, label: 'Hero shot' }, 'beans')).toBe(true);
    expect(matchesSearch({ name: NAME, label: 'Hero shot' }, 'tea')).toBe(false);
  });
});
