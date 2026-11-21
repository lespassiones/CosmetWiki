/**
 * Gabarits des e-mails transactionnels du site (HTML inline, compatible
 * Gmail / Outlook : tableaux, styles en ligne, aucune image SVG).
 *
 * Logique PURE (aucun accès réseau), testée dans tests/brandSubmission.test.ts.
 * Le mail « produit référencé » part de l'admin (CosmeCheckAdmin), pas d'ici :
 * le site ne fait que recevoir les fiches.
 * Règle de style : jamais de tiret cadratin ni demi-cadratin dans les textes.
 */
export type Email = { subject: string; html: string };

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Texte saisi par une personne → HTML sûr, retours à la ligne conservés. */
function para(s: string): string {
  return escapeHtml(s).replace(/\n/g, "<br>");
}

function layout(title: string, body: string, footer?: string): string {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#F6F7F9;font-family:Helvetica,Arial,sans-serif;color:#111111;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F7F9;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:16px;border:1px solid #ECEEF1;">
<tr><td style="padding:24px 28px 8px 28px;font-size:22px;font-weight:700;letter-spacing:-0.3px;"><span style="color:#111111;">Cosme </span><span style="color:#F43F5E;">Check</span></td></tr>
<tr><td style="padding:8px 28px 28px 28px;font-size:15px;line-height:1.6;color:#1F2937;">${body}</td></tr>
</table>
<p style="max-width:600px;margin:16px auto 0 auto;font-size:12px;line-height:1.5;color:#9CA3AF;">${
    footer ??
    "Cosme Check, l'application qui décrypte la composition des cosmétiques. cosme-check.com"
  }</p>
</td></tr></table></body></html>`;
}

function row(label: string, value: string | null | undefined): string {
  if (!value) return "";
  return `<tr><td style="padding:6px 12px 6px 0;color:#6B7280;font-size:13px;vertical-align:top;white-space:nowrap;">${escapeHtml(
    label,
  )}</td><td style="padding:6px 0;font-size:14px;color:#111111;vertical-align:top;">${value}</td></tr>`;
}

function link(url: string, text?: string): string {
  const safe = escapeHtml(url);
  return `<a href="${safe}" style="color:#E11D48;text-decoration:underline;word-break:break-all;">${escapeHtml(text ?? url)}</a>`;
}

function button(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr><td style="background:#F43F5E;border-radius:999px;"><a href="${escapeHtml(
    url,
  )}" style="display:inline-block;padding:13px 26px;color:#FFFFFF;font-weight:700;font-size:15px;text-decoration:none;">${escapeHtml(
    label,
  )}</a></td></tr></table>`;
}

function formatDate(d: Date): string {
  return d.toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "long", timeStyle: "short" });
}

// ─── Page contact → équipe ─────────────────────────────────────────────────

export function contactTeamEmail(input: {
  firstName: string;
  email: string;
  subject: string;
  message: string;
  receivedAt?: Date;
}): Email {
  const when = formatDate(input.receivedAt ?? new Date());
  const body = `<p style="margin:0 0 16px 0;font-size:17px;font-weight:700;">Nouveau message depuis la page contact</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
${row("Prénom", escapeHtml(input.firstName))}
${row("E-mail", link(`mailto:${input.email}`, input.email))}
${row("Sujet", escapeHtml(input.subject))}
${row("Reçu le", escapeHtml(when))}
</table>
<div style="background:#F9FAFB;border:1px solid #ECEEF1;border-radius:12px;padding:16px;font-size:15px;line-height:1.6;">${para(
    input.message,
  )}</div>
<p style="margin:16px 0 0 0;font-size:13px;color:#6B7280;">Pour répondre, utilisez simplement « Répondre » : la réponse part directement chez ${escapeHtml(
    input.firstName,
  )}.</p>`;
  return {
    subject: `[Contact] ${input.subject} : ${input.firstName}`,
    html: layout("Nouveau message", body, "Notification interne Cosme Check (page contact du site)."),
  };
}

// ─── Espace marques ────────────────────────────────────────────────────────

export type BrandSubmissionForEmail = {
  id: string;
  brand: string;
  company: string | null;
  contactName: string | null;
  contactEmail: string;
  contactRole: string | null;
  brandWebsite: string | null;
  productName: string;
  ean: string | null;
  volume: string;
  productType: string | null;
  zones: string[];
  inci: string;
  properties: string | null;
  madeIn: string | null;
  productUrl: string | null;
};

export function brandTeamEmail(
  s: BrandSubmissionForEmail,
  extra: { photoUrls: { label: string; url: string }[]; adminUrl?: string | null; earlierFromBrand?: number },
): Email {
  const photos = extra.photoUrls.length
    ? extra.photoUrls.map((p) => link(p.url, p.label)).join(" · ")
    : "Aucune photo jointe";
  const body = `<p style="margin:0 0 6px 0;font-size:17px;font-weight:700;">Nouvelle demande de référencement</p>
<p style="margin:0 0 16px 0;color:#6B7280;font-size:14px;">${escapeHtml(s.brand)} propose « ${escapeHtml(
    s.productName,
  )} ». À vérifier avant de le référencer.</p>
<p style="margin:16px 0 4px 0;font-size:12px;font-weight:700;letter-spacing:0.6px;color:#9CA3AF;">LA MARQUE</p>
<table role="presentation" cellpadding="0" cellspacing="0">
${row("Marque", escapeHtml(s.brand))}
${row("Société", s.company ? escapeHtml(s.company) : null)}
${row(
  "Contact",
  s.contactName || s.contactRole ? escapeHtml([s.contactName, s.contactRole].filter(Boolean).join(", ")) : null,
)}
${row("E-mail", link(`mailto:${s.contactEmail}`, s.contactEmail))}
${row("Site", s.brandWebsite ? link(s.brandWebsite) : null)}
${row(
  "Déjà proposés",
  extra.earlierFromBrand ? escapeHtml(`${extra.earlierFromBrand} autre(s) produit(s) par cette adresse`) : null,
)}
</table>
<p style="margin:18px 0 4px 0;font-size:12px;font-weight:700;letter-spacing:0.6px;color:#9CA3AF;">LE PRODUIT</p>
<table role="presentation" cellpadding="0" cellspacing="0">
${row("Nom", escapeHtml(s.productName))}
${row("Code-barres", escapeHtml(s.ean ?? "Sans code-barres"))}
${row("Contenance", escapeHtml(s.volume))}
${row("Type", s.productType ? escapeHtml(s.productType) : null)}
${row("Zones", escapeHtml(s.zones.join(", ")))}
${row("Fabriqué", s.madeIn ? escapeHtml(s.madeIn) : null)}
${row("Page produit", s.productUrl ? link(s.productUrl) : "Non fournie")}
${row("Photos", photos)}
</table>
<p style="margin:18px 0 6px 0;font-size:12px;font-weight:700;letter-spacing:0.6px;color:#9CA3AF;">COMPOSITION (INCI)</p>
<div style="background:#F9FAFB;border:1px solid #ECEEF1;border-radius:12px;padding:14px;font-size:13px;line-height:1.55;font-family:Menlo,Consolas,monospace;">${para(
    s.inci,
  )}</div>
${
  s.properties
    ? `<p style="margin:18px 0 6px 0;font-size:12px;font-weight:700;letter-spacing:0.6px;color:#9CA3AF;">PROPRIÉTÉS ANNONCÉES</p><div style="font-size:14px;">${para(
        s.properties,
      )}</div>`
    : ""
}
${
  extra.adminUrl
    ? button(extra.adminUrl, "Vérifier dans l'admin")
    : `<p style="margin:20px 0 0 0;font-size:14px;">À traiter dans l'admin : Retours, onglet « Marques ».</p>`
}
<p style="margin:8px 0 0 0;font-size:12px;color:#9CA3AF;">Réf. ${escapeHtml(s.id)}</p>`;
  return {
    subject: `[Marques] ${s.brand} : ${s.productName}`,
    html: layout("Demande de référencement", body, "Notification interne Cosme Check (espace marques du site)."),
  };
}

export function brandAckEmail(s: { contactName: string | null; brand: string; productName: string }): Email {
  const body = `<p style="margin:0 0 14px 0;">Bonjour${s.contactName ? ` ${escapeHtml(s.contactName)}` : ""},</p>
<p style="margin:0 0 14px 0;">Nous avons bien reçu votre demande de référencement pour <strong>${escapeHtml(
    s.productName,
  )}</strong> (${escapeHtml(s.brand)}).</p>
<p style="margin:0 0 14px 0;">Notre équipe va vérifier les informations. Le produit n'est pas encore visible dans l'application : nous vous écrivons dès qu'il est référencé, avec sa note et votre badge.</p>
<p style="margin:0;">Bien cordialement,<br>L'équipe Cosme Check</p>`;
  return {
    subject: `Nous avons bien reçu votre produit ${s.productName}`,
    html: layout("Demande reçue", body),
  };
}
