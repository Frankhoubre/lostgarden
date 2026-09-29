import type { Locale } from "@/lib/i18n/config";
import { fill } from "@/lib/webtoon/text";

/**
 * The words of the episode-alert emails, in the subscriber's language. The
 * announcement subject and text are defaults: the studio prefills them and
 * may edit them before sending.
 */
type MailWords = {
  confirmSubject: string;
  confirmBody: string;
  confirmButton: string;
  announceSubject: string;
  announceText: string;
  readButton: string;
  footer: string;
  unsubscribe: string;
};

export const MAIL_WORDS: Record<Locale, MailWords> = {
  fr: {
    confirmSubject: "Confirmez votre inscription aux épisodes de Lost Garden",
    confirmBody:
      "Bonjour,\n\nVous avez demandé à recevoir un e-mail quand un nouvel épisode de Lost Garden paraît. Pour confirmer, ouvrez ce lien :\n{link}\n\nLe lien est valable 7 jours. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : rien ne vous sera envoyé.",
    confirmButton: "Confirmer mon inscription",
    announceSubject: "Nouvel épisode de Lost Garden : {title}",
    announceText: "{title} vient de paraître sur lostgarden.world. Bonne lecture.",
    readButton: "Lire l'épisode",
    footer: "Vous recevez cet e-mail parce que vous avez confirmé votre inscription aux nouveaux épisodes de Lost Garden.",
    unsubscribe: "Se désinscrire en un clic",
  },
  en: {
    confirmSubject: "Confirm your Lost Garden episode alerts",
    confirmBody:
      "Hello,\n\nYou asked to get an email when a new episode of Lost Garden comes out. To confirm, open this link:\n{link}\n\nThe link works for 7 days. If you did not ask for this, ignore this message: nothing will be sent to you.",
    confirmButton: "Confirm my subscription",
    announceSubject: "New Lost Garden episode: {title}",
    announceText: "{title} is out now on lostgarden.world. Enjoy the read.",
    readButton: "Read the episode",
    footer: "You are getting this email because you confirmed you wanted to hear about new Lost Garden episodes.",
    unsubscribe: "Unsubscribe in one click",
  },
  ja: {
    confirmSubject: "Lost Garden 新エピソードのお知らせ登録を確認してください",
    confirmBody:
      "Lost Garden の新しいエピソードが公開されたときにメールを受け取る登録を受け付けました。次のリンクを開いて確認してください。\n{link}\n\nリンクの有効期限は7日間です。お心当たりがない場合は、このメールを無視してください。今後メールが届くことはありません。",
    confirmButton: "登録を確認する",
    announceSubject: "Lost Garden 新エピソード公開：{title}",
    announceText: "{title} が lostgarden.world で公開されました。お楽しみください。",
    readButton: "エピソードを読む",
    footer: "Lost Garden の新エピソードのお知らせに登録されているため、このメールをお送りしています。",
    unsubscribe: "ワンクリックで配信停止",
  },
  ko: {
    confirmSubject: "Lost Garden 새 에피소드 알림 신청을 확인해 주세요",
    confirmBody:
      "Lost Garden의 새 에피소드가 공개될 때 이메일을 받도록 신청하셨습니다. 아래 링크를 열어 확인해 주세요.\n{link}\n\n링크는 7일 동안 유효합니다. 직접 신청하지 않으셨다면 이 메일을 무시하세요. 앞으로 아무것도 발송되지 않습니다.",
    confirmButton: "신청 확인하기",
    announceSubject: "Lost Garden 새 에피소드: {title}",
    announceText: "새 에피소드가 공개되었습니다: {title}. lostgarden.world에서 바로 읽어 보세요.",
    readButton: "에피소드 읽기",
    footer: "Lost Garden 새 에피소드 알림을 신청하셨기 때문에 이 메일을 보내드립니다.",
    unsubscribe: "한 번의 클릭으로 수신 거부",
  },
};

export type MailContent = { subject: string; text: string; html: string };

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

const paragraphs = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");

function layout(lang: Locale, inner: string): string {
  return `<!doctype html><html lang="${lang}"><body style="margin:0;padding:24px;background:#f4f1ec;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1d1b22;font-size:15px;line-height:1.55"><div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px">${inner}</div></body></html>`;
}

const button = (href: string, label: string) =>
  `<p style="margin:24px 0"><a href="${escapeHtml(href)}" style="display:inline-block;background:#6b3fd4;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">${escapeHtml(label)}</a></p>`;

export function confirmationMail(locale: Locale, link: string): MailContent {
  const w = MAIL_WORDS[locale];
  const text = fill(w.confirmBody, { link });
  // In HTML the link becomes a button; the plain paragraph around it stays.
  const [before, after = ""] = w.confirmBody.split("{link}");
  const html = layout(locale, `<p style="margin:0 0 8px;font-weight:700;letter-spacing:.04em">LOST GARDEN</p>${paragraphs(before.trim())}${button(link, w.confirmButton)}${paragraphs(after.trim())}`);
  return { subject: w.confirmSubject, text, html };
}

export function announcementMail(locale: Locale, { subject, text, link, unsubscribeLink }: { subject: string; text: string; link: string; unsubscribeLink: string }): MailContent {
  const w = MAIL_WORDS[locale];
  const colon = locale === "fr" ? " :" : ":";
  const plain = `${text}\n\n${w.readButton}${colon} ${link}\n\n--\n${w.footer}\n${w.unsubscribe}${colon} ${unsubscribeLink}`;
  const html = layout(
    locale,
    `<p style="margin:0 0 8px;font-weight:700;letter-spacing:.04em">LOST GARDEN</p>${paragraphs(text)}${button(link, w.readButton)}<hr style="border:0;border-top:1px solid #e6e1d8;margin:24px 0 12px"><p style="margin:0;font-size:12px;color:#6d6874">${escapeHtml(w.footer)} <a href="${escapeHtml(unsubscribeLink)}" style="color:#6d6874">${escapeHtml(w.unsubscribe)}</a></p>`,
  );
  return { subject, text: plain, html };
}
