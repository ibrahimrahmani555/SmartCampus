import { Resend } from 'resend'

export interface MailSender {
  sendPasswordReset(email: string, link: string): Promise<void>
}

export class DevelopmentMailSender implements MailSender {
  async sendPasswordReset(email: string, link: string): Promise<void> {
    console.info(`Password reset link for ${email}: ${link}`)
  }
}

export class ResendMailSender implements MailSender {
  private readonly client: Resend
  private readonly from: string

  constructor(apiKey: string, from: string) {
    this.client = new Resend(apiKey)
    this.from = from
  }

  async sendPasswordReset(email: string, link: string): Promise<void> {
    const escapedLink = link.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    const { error } = await this.client.emails.send({
      from: this.from,
      to: email,
      subject: 'Réinitialisation de votre mot de passe SmartCampus',
      html: `<p>Vous avez demandé à réinitialiser votre mot de passe SmartCampus.</p><p><a href="${escapedLink}">Choisir un nouveau mot de passe</a></p><p>Ce lien expire dans une heure. Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.</p>`,
    })
    if (error) throw new Error('Resend failed to send password reset email')
  }
}

export function createMailSender(
  senderName = process.env.MAIL_SENDER,
  apiKey = process.env.RESEND_API_KEY,
  from = process.env.RESEND_FROM_EMAIL,
): MailSender {
  if (senderName !== 'resend') return new DevelopmentMailSender()
  if (!apiKey || !from) {
    throw new Error('MAIL_SENDER=resend requires RESEND_API_KEY and RESEND_FROM_EMAIL')
  }
  return new ResendMailSender(apiKey, from)
}

export const mailSender: MailSender = createMailSender()
