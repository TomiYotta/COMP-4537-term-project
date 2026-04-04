const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendResetEmail = async (to, token) => {
  const resetLink = `http://localhost:3000/reset-password?token=${token}`

  const msg = {
    to,
    from: 'yourverifiedemail@gmail.com', // MUST be verified in SendGrid
    subject: 'Password Reset',
    text: `Reset your password: ${resetLink}`,
    html: `<p>Click here to reset your password:</p>
           <a href="${resetLink}">${resetLink}</a>`,
  }

  await sgMail.send(msg)
}

module.exports = { sendResetEmail }