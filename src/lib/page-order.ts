/**
 * Page map advice: where each section sits in the buyer's journey, what is out of
 * order, and a suggested order. The suggestion is a stable sort, so sections in the
 * same step keep the owner's order.
 */
import type { BlockType, BuilderBlock, Bi, Lang } from './builder';
import { pick } from './builder';

export type FlowStage = 'attention' | 'why' | 'details' | 'price' | 'action' | 'doubts' | 'rules' | 'close' | 'footer';

/** The journey from first glance to sign-up, in order. */
export const FLOW: FlowStage[] = ['attention', 'why', 'details', 'price', 'action', 'doubts', 'rules', 'close', 'footer'];

export const STAGE_OF: Record<BlockType, FlowStage> = {
  hero: 'attention',
  benefits: 'why',
  gallery: 'details',
  steps: 'details',
  included: 'details',
  inclusions: 'details',
  offer: 'price',
  form: 'action',
  faq: 'doubts',
  terms: 'rules',
  finalCta: 'close',
  contact: 'footer',
};

/** "Why" and "details" share a rank: either may come first. */
const RANK: Record<FlowStage, number> = { attention: 0, why: 1, details: 1, price: 2, action: 3, doubts: 4, rules: 5, close: 6, footer: 7 };

export type OrderIssueKey = 'noHero' | 'heroFirst' | 'finalLast' | 'formBeforeOffer' | 'faqBeforeOffer' | 'termsEarly' | 'detailsAfterOffer' | 'noForm';

export interface OrderIssue {
  key: OrderIssueKey;
  /** The section the advice is about; none for page-wide advice. */
  blockId?: string;
  severity: 'high' | 'medium' | 'tip';
}

export function suggestedOrder(blocks: BuilderBlock[]): BuilderBlock[] {
  return blocks
    .map((b, i) => ({ b, i, r: RANK[STAGE_OF[b.type]] }))
    .sort((x, y) => x.r - y.r || x.i - y.i)
    .map((x) => x.b);
}

export function sameOrder(a: BuilderBlock[], b: BuilderBlock[]): boolean {
  return a.length === b.length && a.every((x, i) => x.id === b[i].id);
}

export function orderIssues(blocks: BuilderBlock[]): OrderIssue[] {
  const issues: OrderIssue[] = [];
  if (!blocks.length) return issues;
  const first = (type: BlockType) => blocks.findIndex((b) => b.type === type);
  const hero = first('hero');
  const offer = first('offer');
  const form = first('form');
  const faq = first('faq');
  const terms = first('terms');

  if (hero < 0) issues.push({ key: 'noHero', severity: 'high' });
  else if (hero !== 0) issues.push({ key: 'heroFirst', blockId: blocks[hero].id, severity: 'high' });

  // The final call to action closes the page; only a contact footer may follow it.
  let lastMain = blocks.length - 1;
  while (lastMain > 0 && STAGE_OF[blocks[lastMain].type] === 'footer') lastMain--;
  const finals = blocks.map((b, i) => ({ b, i })).filter((x) => x.b.type === 'finalCta');
  for (const x of finals) if (x.i !== lastMain) issues.push({ key: 'finalLast', blockId: x.b.id, severity: 'medium' });

  if (offer >= 0) {
    if (form >= 0 && form < offer) issues.push({ key: 'formBeforeOffer', blockId: blocks[form].id, severity: 'medium' });
    if (faq >= 0 && faq < offer) issues.push({ key: 'faqBeforeOffer', blockId: blocks[faq].id, severity: 'tip' });
    if (terms >= 0 && terms < offer) issues.push({ key: 'termsEarly', blockId: blocks[terms].id, severity: 'medium' });
    blocks.forEach((b, i) => {
      const s = STAGE_OF[b.type];
      if (i > offer && (s === 'why' || s === 'details')) issues.push({ key: 'detailsAfterOffer', blockId: b.id, severity: 'tip' });
    });
  } else if (terms >= 0 && form >= 0 && terms < form) {
    issues.push({ key: 'termsEarly', blockId: blocks[terms].id, severity: 'medium' });
  }

  if (form < 0) issues.push({ key: 'noForm', severity: 'tip' });
  return issues;
}

/** The main text of a section, for the map and other outlines. */
export function blockLabel(block: BuilderBlock, lang: Lang): string {
  const main: Bi | undefined = block.type === 'hero' || block.type === 'finalCta' ? block.headline : block.title;
  return main ? pick(main, lang).trim() : '';
}
