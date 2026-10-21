export interface ContactPerson {
  name: string;
  phone: string;
  phoneRaw: string;
  role: string;
}

export const OFFICIAL_CONTACTS: ContactPerson[] = [
  {
    name: 'Baskar',
    phone: '+91 96005 89191',
    phoneRaw: '+919600589191',
    role: 'Sales & Enquiries',
  },
  {
    name: 'Anto',
    phone: '+91 744 892 6902',
    phoneRaw: '+917448926902',
    role: 'Site Visits & Verification',
  },
  {
    name: 'Dhinakaran',
    phone: '+91 97904 93891',
    phoneRaw: '+919790493891',
    role: 'Customer Relations & Booking',
  },
];

export const PRIMARY_CONTACT_PHONE = '+91 96005 89191';
export const ALL_CONTACTS_DISPLAY = 'Baskar (+91 96005 89191) • Anto (+91 744 892 6902) • Dhinakaran (+91 97904 93891)';
