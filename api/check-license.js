export default function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ ok: false });
  }

  let body = request.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const submitted = String(body?.key || '').trim();
  const secret = String(process.env.LICENSE_KEY || '').trim();

  if (!secret) {
    return response.status(500).json({ ok: false, message: 'LICENSE_KEY is not set.' });
  }

  return response.status(200).json({ ok: submitted === secret });
}
