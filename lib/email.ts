import 'server-only';
import sgMail, { MailDataRequired } from '@sendgrid/mail';

const REQUIRED_VARS = ['SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL'] as const;

function ensureEnv() {
  const missing = REQUIRED_VARS.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}

function initSendGrid() {
  ensureEnv();
  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
}

export type EmailAddress = string | { email: string; name?: string };

export type SendEmailOptions = {
  to: EmailAddress | EmailAddress[];
  subject: string;
  html?: string;
  text?: string;
  cc?: EmailAddress | EmailAddress[];
  bcc?: EmailAddress | EmailAddress[];
  replyTo?: EmailAddress;
  headers?: Record<string, string>;
  categories?: string[];
};

export async function sendEmail(opts: SendEmailOptions) {
  initSendGrid();

  const fromEmail = process.env.SENDGRID_FROM_EMAIL!;
  const fromName = process.env.SENDGRID_FROM_NAME;

  const msg: MailDataRequired = {
    to: opts.to as any,
    from: fromName ? { email: fromEmail, name: fromName } : fromEmail,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    cc: opts.cc as any,
    bcc: opts.bcc as any,
    replyTo: opts.replyTo as any,
    headers: opts.headers,
    categories: opts.categories,
    mailSettings:
      process.env.SENDGRID_SANDBOX_MODE === 'true'
        ? { sandboxMode: { enable: true } }
        : undefined
  };

  // SendGrid returns [response, body?]
  return sgMail.send(msg);
}

const emailService = { sendEmail };
export default emailService;
