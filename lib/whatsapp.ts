const WHATSAPP_API_URL = 'https://graph.facebook.com/v19.0'
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const API_TOKEN = process.env.WHATSAPP_API_TOKEN

async function whatsappRequest(body: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`WhatsApp API error: ${res.status} ${err}`)
  }
}

export async function sendWhatsAppMessage(phone: string, message: string): Promise<void> {
  await whatsappRequest({
    messaging_product: 'whatsapp',
    to: phone,
    type: 'text',
    text: { body: message },
  })
}

export async function sendWhatsAppVideo(
  phone: string,
  videoUrl: string,
  caption: string
): Promise<void> {
  await whatsappRequest({
    messaging_product: 'whatsapp',
    to: phone,
    type: 'video',
    video: { link: videoUrl, caption },
  })
}
