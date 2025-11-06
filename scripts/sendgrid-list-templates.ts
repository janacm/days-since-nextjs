#!/usr/bin/env tsx
import 'dotenv/config';
import sgClient from '@sendgrid/client';

async function main() {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) throw new Error('SENDGRID_API_KEY is required');
  sgClient.setApiKey(apiKey);

  const req = { method: 'GET', url: '/v3/templates' } as const;
  const [res, body] = await sgClient.request(req);
  console.log('Status:', res.statusCode);
  console.log('Templates:', JSON.stringify((body as any).templates ?? body, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});