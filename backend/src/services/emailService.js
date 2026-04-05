import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendPasswordResetEmail(to, resetLink) {
  const msg = {
    to,
    from: "timmythenintendo@gmail.com",
    subject: "Password Reset Request",
    text: `Reset your password here: ${resetLink}`,
    html: `<p>Click below to reset your password:</p><a href="${resetLink}">${resetLink}</a>`,
  };

  await sgMail.send(msg);
}