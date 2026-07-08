import nodemailer, { Transporter } from 'nodemailer';

/**
 * Transactional email via SMTP (provider-agnostic through nodemailer).
 * Configure with SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / MAIL_FROM.
 * If not configured, emails are skipped (logged) so the app keeps working.
 */

const STORE_NAME = process.env.STORE_NAME || 'Nuvo';
const STORE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.MAIL_FROM || '';

let transporter: Transporter | null = null;

export const isEmailConfigured = (): boolean =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = (): Transporter => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

interface SendArgs {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email. Never throws to the caller: failures are logged so they don't
 * break order processing.
 */
const send = async ({ to, subject, html }: SendArgs): Promise<void> => {
  if (!isEmailConfigured()) {
    console.log(`[Email] Skipped (SMTP not configured): "${subject}" -> ${to}`);
    return;
  }
  if (!to) {
    console.log(`[Email] Skipped (no recipient): "${subject}"`);
    return;
  }
  try {
    const from = process.env.MAIL_FROM || `${STORE_NAME} <no-reply@${new URL(STORE_URL).hostname}>`;
    await getTransporter().sendMail({ from, to, subject, html });
    console.log(`[Email] Sent: "${subject}" -> ${to}`);
  } catch (error) {
    console.error(`[Email] Failed to send "${subject}" to ${to}:`, error);
  }
};

/* ------------------------------------------------------------------ *
 * Templates
 * ------------------------------------------------------------------ */

const layout = (title: string, bodyHtml: string): string => `
  <div style="background:#f4f4f5;padding:32px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #eee;">
      <div style="background:#111827;padding:20px 24px;">
        <span style="color:#fff;font-size:20px;font-weight:700;">${STORE_NAME}</span>
      </div>
      <div style="padding:28px 24px;color:#111827;">
        <h1 style="font-size:20px;margin:0 0 16px;">${title}</h1>
        ${bodyHtml}
      </div>
      <div style="padding:18px 24px;border-top:1px solid #eee;color:#6b7280;font-size:12px;">
        <p style="margin:0 0 4px;">Besoin d'aide ? ${
          SUPPORT_EMAIL ? `Contactez-nous à <a href="mailto:${SUPPORT_EMAIL}" style="color:#111827;">${SUPPORT_EMAIL}</a>.` : 'Répondez simplement à cet email.'
        }</p>
        <p style="margin:0;">&copy; ${new Date().getFullYear()} ${STORE_NAME}</p>
      </div>
    </div>
  </div>
`;

export interface OrderEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  productTitle: string;
  quantity: number;
  totalPaid: number | string;
  trackingNumber?: string | null;
}

/**
 * Order confirmation email, sent right after payment.
 */
export const sendOrderConfirmation = async (data: OrderEmailData): Promise<void> => {
  const trackUrl = `${STORE_URL}/suivi?order=${encodeURIComponent(data.orderId)}&email=${encodeURIComponent(
    data.customerEmail
  )}`;
  const body = `
    <p style="margin:0 0 12px;">Bonjour ${data.customerName || ''},</p>
    <p style="margin:0 0 16px;">Merci pour votre commande ! Nous la préparons. Voici le récapitulatif :</p>
    <div style="background:#f9fafb;border-radius:12px;padding:16px;margin:0 0 16px;">
      <p style="margin:0 0 6px;"><strong>Commande :</strong> ${data.orderId}</p>
      <p style="margin:0 0 6px;"><strong>Produit :</strong> ${data.productTitle} × ${data.quantity}</p>
      <p style="margin:0;"><strong>Total payé :</strong> ${data.totalPaid} €</p>
    </div>
    <p style="margin:0 0 16px;">Vous pouvez suivre l'état de votre commande à tout moment :</p>
    <p style="margin:0 0 8px;">
      <a href="${trackUrl}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600;">Suivre ma commande</a>
    </p>
    <p style="margin:16px 0 0;font-size:13px;color:#6b7280;">Conservez cet email : il contient votre numéro de commande, utile en cas de question.</p>
  `;
  await send({
    to: data.customerEmail,
    subject: `Confirmation de votre commande ${STORE_NAME}`,
    html: layout('Commande confirmée', body),
  });
};

/**
 * Shipping notification email, sent when a tracking number becomes available.
 */
export const sendShippingNotification = async (data: OrderEmailData): Promise<void> => {
  const trackUrl = `${STORE_URL}/suivi?order=${encodeURIComponent(data.orderId)}&email=${encodeURIComponent(
    data.customerEmail
  )}`;
  const body = `
    <p style="margin:0 0 12px;">Bonjour ${data.customerName || ''},</p>
    <p style="margin:0 0 16px;">Bonne nouvelle : votre commande a été expédiée !</p>
    <div style="background:#f9fafb;border-radius:12px;padding:16px;margin:0 0 16px;">
      <p style="margin:0 0 6px;"><strong>Commande :</strong> ${data.orderId}</p>
      <p style="margin:0 0 6px;"><strong>Produit :</strong> ${data.productTitle} × ${data.quantity}</p>
      ${data.trackingNumber ? `<p style="margin:0;"><strong>Numéro de suivi :</strong> ${data.trackingNumber}</p>` : ''}
    </div>
    <p style="margin:0 0 8px;">
      <a href="${trackUrl}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600;">Suivre ma commande</a>
    </p>
  `;
  await send({
    to: data.customerEmail,
    subject: `Votre commande ${STORE_NAME} a été expédiée`,
    html: layout('Commande expédiée', body),
  });
};
