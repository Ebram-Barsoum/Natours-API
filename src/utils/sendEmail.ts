import transporter from "../configs/nodemailer";

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
}

export default async function sendEmail({
  email,
  subject,
  message,
}: EmailOptions) {
  const info = await transporter.sendMail({
    from: "Natours App <support@natours.so>",
    to: email,
    subject,
    text: message,
  });
}
