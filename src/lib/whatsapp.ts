export function buildWhatsAppShareLink(phone: string, message: string): string {
  const digitsOnly = normalizeToDigits(phone);
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}

function normalizeToDigits(phone: string): string {
  const digitsOnly = phone.replace(/[^\d]/g, "").replace(/^0+/, "");
  if (digitsOnly.length > 10) {
    return digitsOnly;
  }
  return `91${digitsOnly}`;
}