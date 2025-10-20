#!/usr/bin/env tsx
import 'dotenv/config';
import sgMail from '@sendgrid/mail';

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith(prefix)) return arg.slice(prefix.length);
  }
  return undefined;
}

async function main() {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error('SENDGRID_API_KEY and SENDGRID_FROM_EMAIL are required');
  }
  sgMail.setApiKey(apiKey);

  const to = getArg('to') || process.env.SENDGRID_TEST_TO;
  if (!to) {
    throw new Error('Provide recipient via --to=email@example.com or SENDGRID_TEST_TO');
  }

  const subject = getArg('subject') || 'SendGrid test email';
  const html = getArg('html') || '<h1>SendGrid test</h1><p>Hello from CLI script.</p>';

  const fromName = process.env.SENDGRID_FROM_NAME;
  const fromAddr = fromName ? { email: from, name: fromName } : from;

  const sandbox = process.env.SENDGRID_SANDBOX_MODE === 'true';

  const [res] = await sgMail.send({
    to,
    from: fromAddr as any,
    subject,
    html,
    mailSettings: sandbox ? { sandboxMode: { enable: true } } : undefined
  });

  console.log('Sent with statusCode:', res.statusCode);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});