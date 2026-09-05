const nodemailer = require('nodemailer');
const config = require('./env');

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  if (config.smtp.user && config.smtp.pass) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass
      }
    });
  } else {
    // In dev/test when no SMTP credentials are provided, create an ethereal test account or test transport
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`[Mailer] Initialized Ethereal test account: ${testAccount.user}`);
    } catch (err) {
      console.warn('[Mailer] Could not create Ethereal test account, using stub transporter');
      transporter = {
        sendMail: async (options) => {
          console.log(`[Mailer Stub] Email sent to: ${options.to}, Subject: ${options.subject}`);
          return { messageId: `stub-${Date.now()}` };
        }
      };
    }
  }

  return transporter;
};

module.exports = {
  getTransporter
};
