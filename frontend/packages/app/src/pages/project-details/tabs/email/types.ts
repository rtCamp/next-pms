export type EmailAddress = {
  name: string;
  email: string;
  image?: string;
};

export type Email = {
  id: string;
  sender: EmailAddress;
  subject: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  body: string;
  sentAt: string;
  status: string;
  attachments: unknown[];
};
