export interface ContactPerson {
  name: string;
  phone: string;
  phoneRaw: string;
  role: string;
}

export const OFFICIAL_CONTACTS: ContactPerson[] = [
  {
    name: 'Jesu Vivian',
    phone: '+91 77081 96238',
    phoneRaw: '+917708196238',
    role: 'Sales & Project Advisor',
  },
];

export const PRIMARY_CONTACT_PHONE = '+91 77081 96238';
export const ALL_CONTACTS_DISPLAY = 'Jesu Vivian (+91 77081 96238)';
