import { EMAIL_TYPES } from "../constants/email.constants.js";

export const emailTemplates = {
  [EMAIL_TYPES.APPLICATION_STATUS]: ({ name, status, jobTitle, company }) => ({
    subject: `Update on your application - ${jobTitle}`,
    html: `
      <h2>Hi ${name},</h2>
      <p>Your application for <strong>${jobTitle}</strong> at <strong>${company}</strong> is now <b>${status}</b>.</p>
      <p>Good luck! 🚀</p>
    `,
  }),

  [EMAIL_TYPES.INTERVIEW]: ({ name, jobTitle, interviewDetails }) => ({
    subject: `Interview Scheduled for ${jobTitle}`,
    html: `
      <h2>Hi ${name},</h2>
      <p>Your interview is scheduled.</p>
      <p><b>Date:</b> ${interviewDetails?.date}</p>
      <p><b>Link:</b> ${interviewDetails?.link}</p>
    `,
  }),

  [EMAIL_TYPES.PAYMENT_SUCCESS]: (payload = {}) => {
  const { name = "User", plan = "your plan", amount = "" } = payload;

  return {
    subject: "Plan Activated 🚀",
    html: `
      <h2>Hi ${name},</h2>
      <p>Your ${plan} has been activated successfully.</p>
      <p>Amount: ${amount}</p>
    `,
  };
},

  [EMAIL_TYPES.PAYMENT_FAILED]: ({ name }) => ({
    subject: "Payment Failed ❌",
    html: `
      <h2>Hi ${name},</h2>
      <p>Your payment failed. Please try again.</p>
    `,
  }),
};