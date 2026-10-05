export interface WhatsAppConfig {
  phone: string;   // international format, no +, e.g. "447911123456"
  apiKey: string;
}

const STORAGE_KEY = 'queueless_wa_config';

export function loadWhatsAppConfig(): WhatsAppConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveWhatsAppConfig(config: WhatsAppConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearWhatsAppConfig() {
  localStorage.removeItem(STORAGE_KEY);
}

export async function sendWhatsAppNotification(config: WhatsAppConfig, message: string): Promise<void> {
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(config.phone)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(config.apiKey)}`;
  // no-cors: the request fires but we can't read the response — that's fine for one-way notifications
  await fetch(url, { method: 'GET', mode: 'no-cors' });
}

export function buildJoinMessage(name: string, service: string, position: number, estWait: number): string {
  return (
    `🔔 New customer joined!\n\n` +
    `👤 ${name}\n` +
    `✂️ ${service}\n` +
    `📍 Position #${position}\n` +
    `⏱ Est. wait: ~${estWait} min\n\n` +
    `Sent via QueueLess`
  );
}
