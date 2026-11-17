/**
 * Lead Notification Email Service via Web3Forms
 * Automatically delivers customer enquiries and leads to mail2baskar88@gmail.com
 */

const DEFAULT_WEB3FORMS_ACCESS_KEY = 'eefe88c1-b0be-4fdf-b140-a1383d289c00';
const ADMIN_PORTAL_LEADS_URL = typeof window !== 'undefined' ? `${window.location.origin}/admin/leads` : '/admin/leads';

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
  const accessKey =
    import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || DEFAULT_WEB3FORMS_ACCESS_KEY;

  try {
    const formData = new FormData();
    formData.append('access_key', accessKey);
    formData.append('from_name', 'JV Constructions Portal');

    // Email Subject
    const sourceTag = data.source ? `[${data.source}]` : '[New Lead]';
    const projectTag = data.projectName ? ` - ${data.projectName}` : '';
    const plotTag = data.plotNumber ? ` (Plot #${data.plotNumber})` : '';
    formData.append('subject', `🚨 ${sourceTag} ${data.customerName}${projectTag}${plotTag}`);

    // Standard Web3Forms parameters
    formData.append('name', data.customerName);
    formData.append('phone', data.phone);
    if (data.email) {
      formData.append('email', data.email);
      formData.append('replyto', data.email);
    }

    // Custom formatted data points for high readability in inbox
    if (data.projectName) formData.append('Project', data.projectName);
    if (data.plotNumber) formData.append('Plot Number', data.plotNumber);
    if (data.location) formData.append('City / Location', data.location);
    if (data.preferredContactMethod) {
      formData.append('Preferred Contact Method', data.preferredContactMethod.toUpperCase());
    }
    if (data.bookingReference) {
      formData.append('Booking Reference', data.bookingReference);
    }
    if (data.source) formData.append('Lead Source', data.source);

    // Full formatted message body
    const bodyLines = [
      '========================================',
      '🏡 NEW LEAD & ENQUIRY RECEIVED',
      '========================================',
      '',
      `• Customer Name: ${data.customerName}`,
      `• Mobile / Phone: ${data.phone}`,
      data.email ? `• Email: ${data.email}` : null,
      data.location ? `• Location / City: ${data.location}` : null,
      '',
      data.projectName ? `• Project: ${data.projectName}` : null,
      data.plotNumber ? `• Plot #: ${data.plotNumber}` : null,
      data.bookingReference ? `• Booking Reference: ${data.bookingReference}` : null,
      data.preferredContactMethod
        ? `• Preferred Contact Channel: ${data.preferredContactMethod.toUpperCase()}`
        : null,
      data.source ? `• Lead Source: ${data.source}` : null,
      '',
      '----------------------------------------',
      'Customer Message / Requirement:',
      data.message && data.message.trim() ? data.message.trim() : 'No additional notes provided.',
      '----------------------------------------',
      '',
      `👉 View and manage this lead in Admin Portal:`,
      ADMIN_PORTAL_LEADS_URL,
    ]
      .filter((line) => line !== null)
      .join('\n');

    formData.append('message', bodyLines);

    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    return {
      success: !!result.success,
      message: result.message || (result.success ? 'Success' : 'Failed to send notification email'),
    };
  } catch (error: any) {
    console.warn('Web3Forms lead notification delivery notice:', error);
    return {
      success: false,
      message: error?.message || 'Network error while sending notification',
    };
  }
}
