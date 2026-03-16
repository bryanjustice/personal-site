/**
 * Vercel Serverless Function — /api/contact
 *
 * Receives enquiry form submissions from the portfolio site and
 * forwards them via Resend. RESEND_API_KEY is read from Vercel's
 * environment — it is never exposed to the browser.
 */
export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const { name, org, email, message } = req.body ?? {};

  // Server-side validation
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set in environment variables.');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Must be a verified sender address in your Resend account.
        from: 'enquiry@bryanjustice.com',
        to:   'bryan@bryanjustice.com',
        reply_to: email,
        subject: `Portfolio Enquiry — ${name}${org ? ' · ' + org : ''}`,
        html: `
          <div style="font-family:monospace;background:#0f172a;color:#cbd5e1;padding:32px;max-width:600px;border:1px solid #334155;">
            <p style="color:#22d3ee;font-size:11px;letter-spacing:0.15em;margin:0 0 16px;">PORTFOLIO ENQUIRY — bjustice.com</p>
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:6px 0;color:#94a3b8;font-size:11px;width:100px;">NAME</td>
                <td style="padding:6px 0;font-size:13px;">${escHtml(name)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#94a3b8;font-size:11px;">ORG</td>
                <td style="padding:6px 0;font-size:13px;">${escHtml(org || '—')}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#94a3b8;font-size:11px;">EMAIL</td>
                <td style="padding:6px 0;font-size:13px;">${escHtml(email)}</td>
              </tr>
            </table>
            <hr style="border:none;border-top:1px solid #334155;margin:16px 0;"/>
            <p style="font-size:13px;line-height:1.7;white-space:pre-wrap;">${escHtml(message)}</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      console.error('Resend API error:', body);
      return res.status(502).json({ error: body.message || 'Email delivery failed.' });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Unexpected error in /api/contact:', err);
    return res.status(500).json({ error: 'Unexpected server error.' });
  }
}

/** Escape HTML special chars to prevent injection in email body. */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
