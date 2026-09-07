import { Resend } from "resend";

import { environmentVariables } from "../../configuration/environmentVariablesConfiguration.js";

const resendClient = new Resend(environmentVariables.RESEND_API_KEY);
const senderAddress = `${environmentVariables.RESEND_FROM_NAME} <${environmentVariables.RESEND_FROM_EMAIL}>`;

interface SendAuthenticationEmailInput {
  recipientEmailAddress: string;
  subject: string;
  heading: string;
  message: string;
  actionLabel: string;
  actionUrl: string;
}

export async function sendAuthenticationEmail(input: SendAuthenticationEmailInput): Promise<void> {
  const { error } = await resendClient.emails.send({
    from: senderAddress,
    to: input.recipientEmailAddress,
    subject: input.subject,
    text: `${input.heading}\n\n${input.message}\n\n${input.actionLabel}: ${input.actionUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#171717"><h1 style="font-size:24px;margin:0 0 16px">${input.heading}</h1><p style="font-size:15px;line-height:1.7;color:#525252">${input.message}</p><a href="${input.actionUrl}" style="display:inline-block;margin-top:16px;padding:12px 18px;border-radius:10px;background:#171717;color:#fff;text-decoration:none;font-weight:600">${input.actionLabel}</a><p style="margin-top:28px;font-size:12px;line-height:1.6;color:#737373">If you did not request this, you can safely ignore this email.</p></div>`,
  });

  if (error) throw new Error("Authentication email delivery failed");
}
