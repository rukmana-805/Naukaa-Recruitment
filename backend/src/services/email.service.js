import { Resend } from "resend";
import { emailTemplates } from "../templates/email.templates.js";

import dotenv from "dotenv";

dotenv.config();

// console.log(process.env.RESEND_API_KEY);

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (data) => {
  try {
    console.log("Sending email with data:", data);
    const { to, type, payload } = data;

    const template = emailTemplates[type];

    if (!template) {
      throw new Error(`Template not found for type: ${type}`);
    }

    const { subject, html } = template(payload);

    await resend.emails.send({
      from: "Naukaa <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    console.log("Email sent:", type);
  } catch (err) {
    console.error("Email failed:", err.message);
    throw err;
  }
};