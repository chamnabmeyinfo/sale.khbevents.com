import { NextRequest, NextResponse } from 'next/server';
import { getLeadById, updateLeadStatus, addLeadNote, deleteLead } from '@/lib/storage';
import { isAuthenticated } from '@/lib/auth';
import { LeadStatus } from '@/lib/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const authed = await isAuthenticated();
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const lead = await getLeadById(id);
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  return NextResponse.json({ lead });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const authed = await isAuthenticated();
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const body = await req.json();

  let updatedLead = null;

  if (body.status) {
    updatedLead = await updateLeadStatus(id, body.status as LeadStatus, body.note);
  } else if (body.note) {
    updatedLead = await addLeadNote(id, body.note, body.author || 'Admin');
  }

  if (!updatedLead) {
    return NextResponse.json({ error: 'Lead not found or update failed' }, { status: 404 });
  }

  return NextResponse.json({ success: true, lead: updatedLead });
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const authed = await isAuthenticated();
  if (!authed) return NextResponse.json({ error: 'Unauthorized. Please login again.' }, { status: 401 });

  const { id } = await context.params;
  const cleanId = decodeURIComponent(id || '').trim();
  const deleted = await deleteLead(cleanId);
  if (!deleted) return NextResponse.json({ error: 'Lead not found or already deleted' }, { status: 404 });

  return NextResponse.json({ success: true, message: 'Lead deleted successfully' });
}
