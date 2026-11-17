export interface ContactPerson {
  name: string;
  phone: string;
  phoneRaw: string;
  role: string;
}

export const OFFICIAL_CONTACTS: ContactPerson[] = [
  {
    name: 'JV Constructions Executive',
    phone: '+91 00000 00000',
    phoneRaw: '+910000000000',
    role: 'Sales & Project Enquiries',
  },
];

export const PRIMARY_CONTACT_PHONE = '+91 00000 00000';
export const ALL_CONTACTS_DISPLAY = 'JV Constructions Executive (+91 00000 00000)';
