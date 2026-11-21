export interface ContactPerson {
  name: string;
  phone: string;
  phoneRaw: string;
  role: string;
}

export const CONTACT_EMAIL = 'v2rocker@gmail.com';

export const OFFICIAL_CONTACTS: ContactPerson[] = [
  {
    name: 'Jesu Vivian',
    phone: '+91 77081 96238',
    phoneRaw: '+917708196238',
    role: 'Sales & Project Advisor',
  },
  {
    name: 'Arun',
    phone: '+91 824 826 9541',
    phoneRaw: '+918248269541',
    role: 'Sales & Project Advisor',
  },
  {
    name: 'Neer',
    phone: '+91 99438 71785',
    phoneRaw: '+919943871785',
    role: 'Sales & Project Advisor',
  },
  {
    name: 'Neer (UAE)',
    phone: '+971 50 819 3880',
    phoneRaw: '+971508193880',
    role: 'Sales & Project Advisor',
  },
];

export const PRIMARY_CONTACT_PHONE = '+91 77081 96238';
export const ALL_CONTACTS_DISPLAY = OFFICIAL_CONTACTS.map((c) => `${c.name} (${c.phone})`).join(', ');
