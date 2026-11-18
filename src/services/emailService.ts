/**
 * Lead Notification Email Service
 * 
 * Central handler for notifying administrators when a new enquiry or booking is made.
 * Ready to connect your preferred email API (e.g., Resend, SendGrid, Postmark, or custom backend).
 */

export interface LeadEmailData {
  customerName: string;
  phone: string;
  email?: string;
  location?: string;
  projectName?: string;
  plotNumber?: string;
  preferredContactMethod?: string;
  message?: string;
  bookingReference?: string;
  source?: string;
}

export async function sendLeadNotificationEmail(
  data: LeadEmailData
): Promise<{ success: boolean; message?: string }> {
  try {
    // Lead details are recorded in Supabase leads/bookings table.
    // When you are ready to connect your new email API (e.g., Resend, Brevo, custom webhook),
    // add your API call here:
    /*
      await fetch('YOUR_EMAIL_API_ENDPOINT', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify(data),
      });
    */

    console.info('[LeadNotification] Enquiry received for dispatch:', {
      customer: data.customerName,
      phone: data.phone,
      project: data.projectName,
      plot: data.plotNumber,
      source: data.source,
    });

    return {
      success: true,
      message: 'Lead notification registered successfully',
    };
  } catch (error: any) {
    console.warn('Lead notification notice:', error);
    return {
      success: false,
      message: error?.message || 'Error processing lead notification',
    };
  }
}
