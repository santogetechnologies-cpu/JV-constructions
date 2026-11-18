/**
 * Lead Notification Email Service
 * Ready to connect your new email API (e.g. Resend, SendGrid, custom SMTP/webhook).
 * Web3Forms API has been removed as requested.
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
    // Lead capture log for tracking incoming inquiries
    console.info('[Lead Notification Service] Lead captured:', {
      customer: data.customerName,
      phone: data.phone,
      email: data.email,
      project: data.projectName,
      plot: data.plotNumber,
      source: data.source,
      bookingRef: data.bookingReference,
    });

    // When you are ready to connect your new email API, add your API call here:
    // e.g.:
    // await fetch('https://your-new-email-api.com/send', {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${YOUR_API_KEY}`, 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data),
    // });

    return {
      success: true,
      message: 'Lead received and recorded successfully',
    };
  } catch (error: any) {
    console.warn('[Lead Notification Service] Error processing lead:', error);
    return {
      success: false,
      message: error?.message || 'Error processing notification',
    };
  }
}
