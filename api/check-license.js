export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false });
  }

  const expected = process.env.LICENSE_KEY;
  const key = (req.body?.key || '').trim();

  if (!expected) {
    return res.status(500).json({ ok: false, message: 'LICENSE_KEY is not set' });
  }

  return res.status(200).json({ ok: key === expected });
}
