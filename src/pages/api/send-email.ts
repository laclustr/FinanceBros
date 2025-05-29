import type { APIRoute } from 'astro';
import brevoAPI from 'sib-api-v3-sdk'

const apiKey = process.env.BREVO_API_KEY;
if (!apiKey) {
  throw new Error('BREVO_API_KEY is not defined');
}

const sendEmail = async (
    to: string,
    toName: string,
    from: string,
    fromName: string,
    subject: string,
    content: string
) => {
    let apiInstance = new brevoAPI.TransactionalEmailsApi();
    let brevoApiKey = apiInstance.authentications['apiKey'];
    brevoApiKey.apiKey = apiKey;

    const sendSmtpEmail = new brevoAPI.SendSmtpEmail({
        to: [{ email: to, name: toName }],
        sender: { email: from, name: fromName },
        subject: subject,
        htmlContent: content
      });
    
    try {
        const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
        return response;
    } catch (error) {
        console.error('Brevo API Error:', error);
        throw error;
    }
};

export const POST: APIRoute = async ({ request }) => {
    try {
      const body = await request.json();
      const { to, to_name, from, from_name, subject, content } = body;
  
      if (!to || !to_name || !from || !from_name || !subject || !content) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400 }
        );
      }
  
      const result = await sendEmail(to, to_name, from, from_name, subject, content);
  
      return new Response(
        JSON.stringify({ success: true, result }),
        { status: 200 }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: error }),
        { status: 500 }
      );
    }
  };