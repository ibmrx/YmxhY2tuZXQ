const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const allowCors = fn => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  return await fn(req, res);
};

const handler = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { operative } = req.body;
        
        console.log('API called for:', operative?.secure_email);
        
        if (!operative || !operative.secure_email) {
            return res.status(400).json({ 
                error: 'Missing operative data',
                received: req.body 
            });
        }

        if (!process.env.RESEND_API_KEY) {
            console.error('RESEND_API_KEY is not set in environment variables');
            return res.status(500).json({ 
                error: 'Server configuration error',
                message: 'RESEND_API_KEY environment variable is missing'
            });
        }

        const html = generateHTMLTemplate(operative);
        const text = generateTextTemplate(operative);
        
        console.log('Attempting to send email to:', operative.secure_email);
        
        const { data, error } = await resend.emails.send({
            from: 'BLACKNET OPERATIVE <verification@blacknet-operative.resend.dev>',
            to: [operative.secure_email],
            subject: 'BLACKNET OPERATIVE - Identity Verification Confirmed',
            html: html,
            text: text
        });

        if (error) {
            console.error('Resend API error:', error);
            return res.status(500).json({ 
                error: 'Email service error',
                details: error.message,
                type: 'resend_error'
            });
        }

        console.log('Email sent successfully. ID:', data?.id);
        return res.status(200).json({ 
            success: true, 
            message: 'Email dispatched to operative',
            emailId: data?.id,
            sentTo: operative.secure_email
        });

    } catch (error) {
        console.error('Server error:', error);
        console.error('Stack trace:', error.stack);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message,
            type: 'server_error'
        });
    }
};

function generateHTMLTemplate(operative) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BLACKNET OPERATIVE - Verification</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; background: #0a0a0a; color: #e0e0e0; line-height: 1.4; }
        .email-container { max-width: 600px; margin: 0 auto; background: #0a0a0a; }
        .classification-banner { background: linear-gradient(90deg, #000 0%, #c00 50%, #000 100%); color: #fff; text-align: center; padding: 6px 0; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; border-bottom: 1px solid #333; }
        .header { padding: 30px 20px; text-align: center; border-bottom: 1px solid #222; }
        .org-name { font-size: 18px; letter-spacing: 3px; margin: 15px 0 5px; color: #fff; }
        .system-title { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
        .verification-status { padding: 25px 20px; text-align: center; background: linear-gradient(to right, #0a0a0a, #111, #0a0a0a); border-bottom: 1px solid #222; }
        .status-badge { display: inline-block; padding: 10px 25px; background: #004400; color: #0f0; border: 1px solid #0a0; border-radius: 2px; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; }
        .details-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; padding: 25px 20px; }
        .detail-card { background: #111; border: 1px solid #222; padding: 15px; }
        .detail-label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
        .detail-value { font-size: 14px; color: #fff; }
        .security-notice { padding: 20px; background: #111; border-top: 1px solid #222; margin-top: 20px; font-size: 11px; color: #888; }
        .footer { padding: 20px; text-align: center; font-size: 10px; color: #555; border-top: 1px solid #222; }
        @media (max-width: 480px) { .details-grid { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="classification-banner">BLACKNET OPERATIVE EYES ONLY</div>
        <div class="header">
            <div class="org-name">BLACKNET OPERATIVE</div>
            <div class="system-title">Secure Identity Verification System</div>
        </div>
        <div class="verification-status">
            <div class="status-badge">Identity Verification Confirmed</div>
        </div>
        <div class="details-grid">
            <div class="detail-card">
                <div class="detail-label">Designation</div>
                <div class="detail-value">${operative.designation}</div>
            </div>
            <div class="detail-card">
                <div class="detail-label">Reference</div>
                <div class="detail-value">${operative.reference}</div>
            </div>
            <div class="detail-card">
                <div class="detail-label">Clearance</div>
                <div class="detail-value">${operative.clearance || 'LEVEL 7'}</div>
            </div>
            <div class="detail-card">
                <div class="detail-label">Status</div>
                <div class="detail-value" style="color: #0f0;">ACTIVE</div>
            </div>
            <div class="detail-card">
                <div class="detail-label">Verification Time</div>
                <div class="detail-value">${new Date().toISOString().replace('T', ' ').substring(0, 19)}</div>
            </div>
            <div class="detail-card">
                <div class="detail-label">Verification Count</div>
                <div class="detail-value">${operative.verification_count || 1}</div>
            </div>
        </div>
        <div class="security-notice">
            <strong>SECURITY PROTOCOL:</strong> This verification has been encrypted and logged in secure audit trails. No response required.
        </div>
        <div class="footer">
            BLACKNET OPERATIVE - Secure Communications<br>
            Protocol Version 2.7.1 | Automated Dispatch
        </div>
    </div>
</body>
</html>
    `;
}

function generateTextTemplate(operative) {
    return `
BLACKNET OPERATIVE - SECURE VERIFICATION CONFIRMED
===================================================

CLASSIFICATION: TOP SECRET // NOFORN

OPERATIVE VERIFICATION CONFIRMED

Designation: ${operative.designation}
Reference: ${operative.reference}
Clearance: ${operative.clearance || 'LEVEL 7'}
Status: ACTIVE
Verification Time: ${new Date().toISOString().replace('T', ' ').substring(0, 19)}
Verification Count: ${operative.verification_count || 1}

SECURITY PROTOCOL:
This verification has been encrypted and logged in secure audit trails.
No response required. Unauthorized distribution is prohibited.

BLACKNET OPERATIVE
Secure Communications
Protocol Version: 2.7.1
    `;
}

module.exports = allowCors(handler);
