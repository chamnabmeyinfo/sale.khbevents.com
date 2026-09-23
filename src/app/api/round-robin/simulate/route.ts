import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { 
  createLead, 
  recordDirectContactRoute, 
  getRoundRobinSettings 
} from '@/lib/storage';
import { selectNextStaff } from '@/lib/round-robin';

const sampleClients = [
  {
    name: 'Oknha Bunleng Heng',
    company: 'Heng Global Logistics & Beverage',
    phone: '+855 12 777 666',
    email: 'bunleng.heng@enterprise.com.kh',
    eventType: 'VIP Trade Delegation',
    budget: '$6,600 (3 VIP Passes)',
    message: 'Interested in meeting with automated green tea machinery manufacturers in Da Lat.'
  },
  {
    name: 'Lok Chumteav Sopheak Vong',
    company: 'Vong Capital Investment Group',
    phone: '+855 12 888 123',
    email: 'sopheak.vong@capital.com.kh',
    eventType: 'Smart City & Retail Tech',
    budget: '$4,400 (2 Executive Passes)',
    message: 'Looking for smart retail kiosk suppliers and digital payment integrations.'
  },
  {
    name: 'Neak Oknha Chamroeun Ly',
    company: 'Prestige Cafe Chain Cambodia',
    phone: '+855 12 999 555',
    email: 'chamroeun@prestigecafe.kh',
    eventType: 'Specialty Coffee & Cafe Roastery',
    budget: '$2,200 (1 VIP Pass)',
    message: 'We want exclusive import rights for single-origin Vietnamese arabica beans.'
  },
  {
    name: 'Dara Pich',
    company: 'Phnom Penh Convention & Expo Ltd',
    phone: '+855 12 345 999',
    email: 'dara.pich@pp-expo.com',
    eventType: 'Exhibition & Trade Mission',
    budget: '$3,300',
    message: 'Coordinating a 5-member procurement delegation for agricultural tech.'
  }
];

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'single_lead'; // 'single_lead' | 'visitor_click' | 'batch_test'
    const pageSlug = body.pageSlug || 'smart-city-tea-cafe';

    const forwarded = req.headers.get('x-forwarded-for');
    const visitorIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Simulation Engine/1.0';

    // ─────────────────────────────────────────────────────────────
    // MODE 1: Single Real Lead Simulation (Dispatches real Telegram)
    // ─────────────────────────────────────────────────────────────
    if (mode === 'single_lead') {
      const sample = sampleClients[Math.floor(Math.random() * sampleClients.length)];
      const clientName = body.clientName || sample.name;
      const company = body.company || sample.company;
      const phone = body.phone || sample.phone;
      const email = body.email || sample.email;
      const budget = body.budget || sample.budget;
      const message = body.message || sample.message;

      const createdLead = await createLead({
        landingPageSlug: pageSlug,
        landingPageTitle: 'Vietnam B2B Business Delegation 2026',
        fullName: clientName,
        email,
        phone,
        company,
        eventType: sample.eventType,
        budgetRange: budget,
        packageInterest: 'VIP Chairman Suite Pass',
        message: `[SIMULATION TEST] ${message}`,
        customFields: {
          simulation: 'true',
          simulatedBy: 'Admin Test Flight'
        },
        utmSource: 'simulation_tool',
        utmCampaign: 'round_robin_test',
        ip: visitorIp,
        userAgent
      });

      return NextResponse.json({
        success: true,
        mode: 'single_lead',
        lead: createdLead,
        routing: createdLead.routing,
        message: createdLead.routing
          ? `Lead successfully simulated and routed to ${createdLead.routing.staffName} (@${createdLead.routing.staffTelegram.replace(/^@/, '')})! Status: ${createdLead.routing.status}`
          : 'Lead created without active Round Robin routing'
      });
    }

    // ─────────────────────────────────────────────────────────────
    // MODE 2: Visitor Direct Contact Click Simulation
    // ─────────────────────────────────────────────────────────────
    if (mode === 'visitor_click') {
      const routeResult = await recordDirectContactRoute({
        pageSlug,
        visitorIp,
        userAgent
      });

      if (!routeResult) {
        return NextResponse.json({
          success: false,
          error: 'Direct contact routing is disabled or no active staff accounts configured.'
        });
      }

      return NextResponse.json({
        success: true,
        mode: 'visitor_click',
        staff: {
          id: routeResult.staff.id,
          name: routeResult.staff.name,
          username: routeResult.staff.telegramUsername,
          role: routeResult.staff.title,
          chatId: routeResult.staff.telegramChatId
        },
        targetTelegramUrl: routeResult.targetTelegramUrl,
        logId: routeResult.logId,
        message: `Visitor click simulated! Routed to ${routeResult.staff.name} (@${routeResult.staff.telegramUsername.replace(/^@/, '')})`
      });
    }

    // ─────────────────────────────────────────────────────────────
    // MODE 3: Batch Percentage Distribution Benchmark (e.g. 10 or 20 leads)
    // ─────────────────────────────────────────────────────────────
    if (mode === 'batch_test') {
      const count = Math.min(Math.max(Number(body.count) || 10, 5), 50);
      const rrSettings = await getRoundRobinSettings();

      if (!rrSettings || !rrSettings.enabled) {
        return NextResponse.json({
          success: false,
          error: 'Round Robin system is currently paused or disabled.'
        });
      }

      const activeStaff = rrSettings.staffList.filter((s) => s.isActive);
      if (activeStaff.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No active staff accounts are currently enabled.'
        });
      }

      const distributionCounts: Record<string, { staff: any; assignedCount: number }> = {};
      activeStaff.forEach((s) => {
        distributionCounts[s.id] = { staff: s, assignedCount: 0 };
      });

      const simulationHistory = [];

      for (let i = 0; i < count; i++) {
        const selection = selectNextStaff(rrSettings);
        if (selection) {
          const { staff, effectivePercentage, nextIndex } = selection;
          distributionCounts[staff.id].assignedCount += 1;
          rrSettings.lastAssignedIndex = nextIndex;

          simulationHistory.push({
            leadIndex: i + 1,
            assignedStaffId: staff.id,
            assignedStaffName: staff.name,
            effectivePercentage
          });
        }
      }

      const summary = Object.values(distributionCounts).map((item) => {
        const actualPercentage = Math.round((item.assignedCount / count) * 100);
        return {
          staffId: item.staff.id,
          staffName: item.staff.name,
          configuredWeight: item.staff.percentage,
          assignedCount: item.assignedCount,
          actualPercentage
        };
      });

      return NextResponse.json({
        success: true,
        mode: 'batch_test',
        totalSimulated: count,
        summary,
        history: simulationHistory
      });
    }

    return NextResponse.json(
      { success: false, error: `Invalid simulation mode: ${mode}` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Simulation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Simulation process failed' },
      { status: 500 }
    );
  }
}
