/**
 * Envoi d'e-mails transactionnels (Brevo, API v3) - CÔTÉ SERVEUR UNIQUEMENT.
 *
 * Deux usages :
 *   - `notifyTeam` : prévient l'équipe (contact@ + boîte perso de Brian) d'un
 *     message de contact ou d'une demande de référencement d'une marque ;
 *   - `sendMail`   : e-mail à une personne extérieure (accusé de réception,
 *     produit référencé...).
 *
 * Fail-open : une panne Brevo ne fait jamais échouer l'action de l'utilisateur
 * (le message est déjà enregistré en base). On renvoie `{ sent: false }` et on
 * journalise.
 */

const API = "https://api.brevo.com/v3/smtp/email";
const TIMEOUT_MS = 6000;

/** Destinataires des notifications internes. Surchargeable par
 *  TEAM_NOTIFY_EMAILS (adresses séparées par des virgules). */
export function teamRecipients(): string[] {
  const fromEnv = (process.env.TEAM_NOTIFY_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.includes("@"));
  return fromEnv.length ? fromEnv : ["contact@cosme-check.com", "clarkybrian@outlook.fr"];
}

function sender(): { name: string; email: string } {
  return { name: "Cosme Check", email: process.env.BREVO_SENDER_EMAIL ?? "contact@cosme-check.com" };
}

export type MailInput = {
  to: { email: string; name?: string | null }[];
  subject: string;
  html: string;
  replyTo?: { email: string; name?: string | null } | null;
  tags?: string[];
};

export type MailResult = { sent: boolean; reason?: string; messageId?: string };

export async function sendMail(input: MailInput): Promise<MailResult> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn("[mail] BREVO_API_KEY absente, e-mail non envoyé:", input.subject);
    return { sent: false, reason: "no-api-key" };
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "api-key": apiKey, accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({
        sender: sender(),
        to: input.to.map((r) => (r.name ? { email: r.email, name: r.name } : { email: r.email })),
        subject: input.subject,
        htmlContent: input.html,
        ...(input.replyTo
          ? {
              replyTo: input.replyTo.name
                ? { email: input.replyTo.email, name: input.replyTo.name }
                : { email: input.replyTo.email },
            }
          : {}),
        ...(input.tags?.length ? { tags: input.tags } : {}),
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const body = (await res.text().catch(() => "")).slice(0, 300);
      console.warn("[mail] échec Brevo", res.status, body);
      return { sent: false, reason: `http-${res.status}` };
    }
    const json = (await res.json().catch(() => ({}))) as { messageId?: string };
    return { sent: true, messageId: json.messageId };
  } catch (e) {
    console.warn("[mail] erreur réseau Brevo", e);
    return { sent: false, reason: "error" };
  } finally {
    clearTimeout(t);
  }
}

/** Notification interne : un seul e-mail, adressé à toute l'équipe. La
 *  réponse (« Répondre ») part directement chez l'expéditeur du formulaire. */
export function notifyTeam(input: Omit<MailInput, "to">): Promise<MailResult> {
  return sendMail({ ...input, to: teamRecipients().map((email) => ({ email })) });
}
