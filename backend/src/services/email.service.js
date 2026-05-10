import nodemailer from "nodemailer";
import { emailTemplates } from "../templates/email.templates.js";
import dotenv from "dotenv";

dotenv.config();

// SMTP configuration for Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Gmail App Password
  },
});

export const sendEmail = async (data) => {
  try {
    console.log("Sending email with data:", data);
    const { to, type, payload } = data;

    const template = emailTemplates[type];

    if (!template) {
      throw new Error(`Template not found for type: ${type}`);
    }

    const { subject, html } = template(payload);

    const mailOptions = {
      from: `"Naukaa" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully via SMTP:", type);
  } catch (err) {
    console.error("SMTP Email failed:", err.message);
    throw err;
  }
};

/* 
// RESEND IMPLEMENTATION (Old)
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmailOld = async (data) => {
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
*/