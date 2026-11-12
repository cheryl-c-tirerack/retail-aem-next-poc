import { startSession } from '@/lib/session/session';

// Stub sign-in (contract 1). AEM's validateLogin POSTs the account-panel form here and parses an XML
// <loginStatus>. The POC calls no auth API (no retail customer/tenant on dev); any submit with a
// username starts the stub session. Real build: call the BFF password grant here. See the plan.

function loginXml(status: 'success' | 'failed'): Response {
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<loginResponse><loginStatus>${status}</loginStatus></loginResponse>`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const username = (form.get('emailLogin') ?? form.get('username') ?? form.get('email') ?? '').toString().trim();

  if (!username) {
    return loginXml('failed');
  }

  await startSession();
  return loginXml('success');
}
