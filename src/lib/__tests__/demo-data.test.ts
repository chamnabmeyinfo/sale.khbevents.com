import { describe, expect, it } from 'vitest';
import { demoReasons, findDemoLeads, parseClearRequest } from '../demo-data';
import type { Lead } from '../types';

const lead = (o: Partial<Lead>): Lead => ({
  id: 'lead-1', landingPageSlug: 'korea', landingPageTitle: 'Korea', fullName: 'Sokha Chan', email: 'sokha@gmail.com', phone: '012', eventType: '', status: 'NEW', notes: [],
  createdAt: '2026-09-25T00:00:00Z', updatedAt: '', ...o,
});

describe('demo data rules', () => {
  const sample = new Set(['lead-101']);
  it('recognises simulation, sample and test leads', () => {
    expect(demoReasons(lead({ message: '[SIMULATION TEST] hello' }), sample)).toEqual(['simulation']);
    expect(demoReasons(lead({ utmSource: 'simulation_tool' }), sample)).toEqual(['simulation']);
    expect(demoReasons(lead({ customFields: { simulation: 'true' } }), sample)).toEqual(['simulation']);
    expect(demoReasons(lead({ id: 'lead-101' }), sample)).toEqual(['sample']);
    expect(demoReasons(lead({ fullName: 'Test VIP Buyer' }), sample)).toEqual(['test']);
    expect(demoReasons(lead({ fullName: 'Optin Tester' }), sample)).toEqual(['test']);
    expect(demoReasons(lead({ email: 'someone@example.com' }), sample)).toEqual(['test']);
  });

  it('never matches ordinary customers', () => {
    for (const name of ['Sokha Chan', 'Testa Kim', 'Oknha Bunleng Heng', 'Contest Winner Co', 'Demonstration Kitchen Ltd']) {
      expect(demoReasons(lead({ fullName: name }), sample)).toEqual([]);
    }
    expect(demoReasons(lead({ email: 'latest@khbevents.com', message: 'We tested the menu' }), sample)).toEqual([]);
  });

  it('lists matches newest first', () => {
    const list = findDemoLeads([
      lead({ id: 'a', fullName: 'Real Person' }),
      lead({ id: 'b', fullName: 'Demo User', createdAt: '2026-09-20T00:00:00Z' }),
      lead({ id: 'c', message: '[SIMULATION TEST] x', createdAt: '2026-09-24T00:00:00Z' }),
    ], sample);
    expect(list.map((l) => l.id)).toEqual(['c', 'b']);
  });

  it('only accepts a confirmed, clean request', () => {
    expect(parseClearRequest({ leadIds: ['a'] })).toBeNull();
    expect(parseClearRequest({ confirm: 'delete', leadIds: ['a'] })).toBeNull();
    expect(parseClearRequest({ confirm: 'DELETE', leadIds: ['a', 'a', '../x', 5], routingLog: 'everything', resetStats: 'yes' })).toEqual({
      leadIds: ['a'], removeSampleStaff: false, routingLog: 'none', resetStats: false, confirm: 'DELETE',
    });
  });
});
