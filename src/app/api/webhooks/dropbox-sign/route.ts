import { getSupabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Dropbox Sign sends an event object
    const event = body?.event;
    if (!event) {
      // Dropbox Sign sends a test callback with just { event: { event_type: "callback_test" } }
      return NextResponse.json({ message: 'Hello API Event Received' });
    }

    const eventType = event.event_type;
    const signatureRequest = event.signature_request;

    if (eventType === 'signature_request_signed' && signatureRequest) {
      const signatureRequestId = signatureRequest.signature_request_id;

      // Update consent_status in Supabase
      const supabase = getSupabase();
      if (supabase && signatureRequestId) {
        const { error } = await supabase
          .from('submissions')
          .update({ consent_status: 'signed' })
          .eq('signature_request_id', signatureRequestId);

        if (error) console.error('Webhook Supabase update error:', error);
      }
    }

    // Dropbox Sign expects this exact response
    return NextResponse.json({ message: 'Hello API Event Received' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ message: 'Hello API Event Received' });
  }
}
