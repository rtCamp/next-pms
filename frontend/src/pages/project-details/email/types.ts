export interface EmailAttachment {
  file_url: string;
  is_private?: 0 | 1;
}

/** A row of `get_project_emails`. */
export interface ApiCommunication {
  name: string;
  communication_date: string | null;
  creation: string | null;
  subject: string | null;
  content: string | null;
  sender: string | null;
  sender_full_name: string | null;
  recipients: string | null;
  cc: string | null;
  bcc: string | null;
  attachments: EmailAttachment[] | null;
  read_by_recipient: 0 | 1;
  delivery_status: string | null;
}

export interface Email {
  id: string;
  sender: { name: string; email: string; image?: string };
  subject: string;
  to: string[];
  cc: string[];
  bcc: string[];
  body: string;
  sentAt: string;
  status: string;
  attachments: EmailAttachment[];
}
