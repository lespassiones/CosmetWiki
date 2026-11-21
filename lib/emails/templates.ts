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

export type BrandContactForEmail = {
  brand: string;
  contactName: string | null;
  contactEmail: string;
};

export type BrandProductForEmail = {
  id: string;
  productName: string;
  ean: string | null;
  volume: string;
  productType: string | null;
  zones: string[];
  inci: string;
  properties: string | null;
  madeIn: string | null;
  productUrl: string | null;
  photoUrls: { label: string; url: string }[];
};

function productBlock(p: BrandProductForEmail, n: number): string {
  const photos = p.photoUrls.length ? p.photoUrls.map((x) => link(x.url, x.label)).join(" · ") : "Aucune";
  return `<div style="margin:18px 0 0 0;padding:16px;border:1px solid #ECEEF1;border-radius:14px;">
<p style="margin:0 0 8px 0;font-size:15px;font-weight:700;">${n}. ${escapeHtml(p.productName)}</p>
<table role="presentation" cellpadding="0" cellspacing="0">
${row("Code-barres", escapeHtml(p.ean ?? "Sans code-barres"))}
${row("Contenance", escapeHtml(p.volume))}
${row("Type", p.productType ? escapeHtml(p.productType) : null)}
${row("Zones", escapeHtml(p.zones.join(", ")))}
${row("Fabriqué", p.madeIn ? escapeHtml(p.madeIn) : null)}
${row("Page produit", p.productUrl ? link(p.productUrl) : "Non fournie")}
${row("Photos", photos)}
${row("Promesses", p.properties ? para(p.properties) : null)}
</table>
<div style="margin-top:8px;background:#F9FAFB;border-radius:10px;padding:10px 12px;font-size:12.5px;line-height:1.5;font-family:Menlo,Consolas,monospace;">${para(
    p.inci,
  )}</div>
</div>`;
}

/** Un seul mail pour toute l'équipe, quel que soit le nombre de produits envoyés. */
export function brandTeamEmail(
  c: BrandContactForEmail,
  products: BrandProductForEmail[],
  extra: { adminUrl?: string | null; earlierFromBrand?: number } = {},
): Email {
  const n = products.length;
  const body = `<p style="margin:0 0 6px 0;font-size:17px;font-weight:700;">${
    n > 1 ? `${n} produits à référencer` : "Un produit à référencer"
  }</p>
<p style="margin:0 0 14px 0;color:#6B7280;font-size:14px;">Envoyé par ${escapeHtml(c.brand)}. Rien n'est publié avant votre vérification.</p>
<table role="presentation" cellpadding="0" cellspacing="0">
${row("Marque", escapeHtml(c.brand))}
${row("Contact", c.contactName ? escapeHtml(c.contactName) : null)}
${row("E-mail", link(`mailto:${c.contactEmail}`, c.contactEmail))}
${row(
  "Déjà proposés",
  extra.earlierFromBrand ? escapeHtml(`${extra.earlierFromBrand} produit(s) lors d'envois précédents`) : null,
)}
</table>
${products.map((p, i) => productBlock(p, i + 1)).join("")}
${
  extra.adminUrl
    ? button(extra.adminUrl, "Vérifier dans l'admin")
    : `<p style="margin:20px 0 0 0;font-size:14px;">À traiter dans l'admin : Retours, onglet « Marques ».</p>`
}`;
  return {
    subject: `[Marques] ${c.brand} : ${n > 1 ? `${n} produits` : products[0]?.productName ?? "1 produit"}`,
    html: layout("Demande de référencement", body, "Notification interne Cosme Check (espace marques du site)."),
  };
}

export function brandAckEmail(c: { contactName: string | null; brand: string }, productNames: string[]): Email {
  const n = productNames.length;
  const list = productNames.map((p) => `<li style="margin:2px 0;">${escapeHtml(p)}</li>`).join("");
  const body = `<p style="margin:0 0 14px 0;">Bonjour${c.contactName ? ` ${escapeHtml(c.contactName)}` : ""},</p>
<p style="margin:0 0 10px 0;">Nous avons bien reçu ${n > 1 ? `vos ${n} produits` : "votre produit"} (${escapeHtml(c.brand)}) :</p>
<ul style="margin:0 0 14px 0;padding-left:20px;">${list}</ul>
<p style="margin:0 0 14px 0;">Notre équipe va vérifier les informations. Rien n'est encore visible dans l'application : nous vous écrivons pour chaque produit référencé, avec sa note et votre badge.</p>
<p style="margin:0;">Bien cordialement,<br>L'équipe Cosme Check</p>`;
  return {
    subject: n > 1 ? `Nous avons bien reçu vos ${n} produits` : `Nous avons bien reçu votre produit ${productNames[0]}`,
    html: layout("Demande reçue", body),
  };
}
