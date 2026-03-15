// /api/send.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, message } = req.body;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'System <inquiry@bryanjustice.com>',
      to: 'bryan@bryanjustice.com',
      subject: `New Technical Enquiry from ${name}`,
      text: `From: ${name} (${email})\n\nMessage: ${message}`,
    }),
  });

  if (response.ok) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(500).json({ error: 'Transmission failed' });
  }
}
