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

  [EMAIL_TYPES.FORGOT_PASSWORD]: ({ name, token }) => ({
    subject: "Forgot Password",
    html: `
      <h2>Hi ${name},</h2>
      <p>Your forgot password</p>
      <p><b>Token:</b> ${token} click this link to reset your password</p>
    `,
  }),

  [EMAIL_TYPES.INVITE_RECRUITER]: ({ email, organizationName, inviteLink }) => ({
    subject: "Invitation from Naukaa as Recruiter",
    html: `
      <h2>From Naukaa Recruitment Protal</h2>
      <h3>Hii ${email}</h3>
      <p>You got a invitation link from Naukaa from ${organizationName} as a Recruiter</p>
      <p><b>Link:</b> ${inviteLink} click this link to create your account</p>
    `,
  }),
};
