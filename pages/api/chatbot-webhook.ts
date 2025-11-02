import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Message is required' });
  }

  const n8nWebhookUrl = process.env.N8N_CHATBOT_WEBHOOK_URL;

  if (!n8nWebhookUrl) {
    console.error('N8N_CHATBOT_WEBHOOK_URL is not defined in environment variables.');
    return res.status(500).json({ message: 'Webhook URL not configured' });
  }

  try {
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: message }), // n8n s'attend souvent à un champ 'text' ou 'body'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur lors de l'envoi au webhook n8n: ${response.status} - ${errorText}`);
      return res.status(response.status).json({ message: `Erreur du webhook n8n: ${errorText}` });
    }

    // Si le webhook n8n renvoie une réponse, vous pouvez la transmettre au client
    const n8nResponse = await response.json();
    res.status(200).json({ message: 'Message envoyé au webhook n8n', n8nResponse });

  } catch (error) {
    console.error("Erreur lors de l'appel au webhook n8n:", error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
}
