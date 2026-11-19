import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

interface NotificationPayload {
  booking_reference: string;
  project_name: string;
  plot_number: string;
  customer_name: string;
  phone: string;
  email?: string;
  location?: string;
  message?: string;
  preferred_contact_method?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: NotificationPayload = await req.json();

    if (!payload.booking_reference || !payload.customer_name || !payload.phone) {
      return new Response(
        JSON.stringify({ error: 'Missing required booking fields (reference, customer_name, phone)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const notificationWebhook = Deno.env.get('SALES_ALERT_WEBHOOK_URL');
    const web3FormsKey = Deno.env.get('WEB3FORMS_ACCESS_KEY') || '9ce768b9-e04c-4186-89d5-338e797143a9';

    // Build notification message
    const alertMessage = {
      title: `🚨 New Real Estate Plot Enquiry: Plot ${payload.plot_number} (${payload.project_name})`,
      booking_reference: payload.booking_reference,
      project: payload.project_name,
      plot: payload.plot_number,
      customer: {
        name: payload.customer_name,
        phone: payload.phone,
        email: payload.email || 'N/A',
        city: payload.location || 'N/A',
        preferred_contact: payload.preferred_contact_method || 'Phone',
      },
      customer_notes: payload.message || 'No additional notes provided.',
      timestamp: new Date().toISOString(),
    };

    console.log('[send-booking-notification] Processed enquiry alert:', JSON.stringify(alertMessage));

    // Send Web3Forms email notification
    try {
      const web3Payload = {
        access_key: web3FormsKey,
        from_name: 'JV Constructions Portal',
        subject: `🚨 [Plot Booking] ${payload.customer_name} - ${payload.project_name} (Plot #${payload.plot_number})`,
        name: payload.customer_name,
        phone: payload.phone,
        email: payload.email || undefined,
        message: [
          '🏡 JV CONSTRUCTIONS - NEW PLOT ENQUIRY',
          `• Customer Name: ${payload.customer_name}`,
          `• Phone: ${payload.phone}`,
          `• Email: ${payload.email || 'N/A'}`,
          `• City/Location: ${payload.location || 'N/A'}`,
          `• Project: ${payload.project_name}`,
          `• Plot Number: #${payload.plot_number}`,
          `• Reference: ${payload.booking_reference}`,
          `• Preferred Contact: ${payload.preferred_contact_method || 'Phone'}`,
          `• Customer Message: ${payload.message || 'No additional notes provided.'}`,
          '\n👉 View lead in Admin Portal: /admin/leads',
        ].join('\n'),
      };

      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(web3Payload),
      });
    } catch (web3Err) {
      console.warn('Web3Forms delivery notice:', web3Err);
    }

    // If an external sales webhook (Slack/Discord/Zapier/CRM) is configured in Supabase secrets
    if (notificationWebhook) {
      try {
        await fetch(notificationWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🏡 *New Plot Enquiry Received!*\n*Project:* ${payload.project_name}\n*Plot #:* ${payload.plot_number}\n*Customer:* ${payload.customer_name} (${payload.phone})\n*Ref:* ${payload.booking_reference}`,
            ...alertMessage,
          }),
        });
      } catch (webhookErr) {
        console.warn('Webhook delivery failed:', webhookErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Booking notification processed successfully',
        reference: payload.booking_reference,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Unhandled exception in send-booking-notification:', message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
