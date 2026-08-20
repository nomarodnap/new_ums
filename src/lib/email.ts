import nodemailer from "nodemailer";

export async function sendEmail(to: string, subject: string, html: string) {
  // Fallback to simulation if no SMTP configuration is provided
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    console.log("==========================================");
    console.log(`📩 [EMAIL SIMULATION - NO SMTP CONFIG] Sending Email...`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html.replace(/<[^>]*>?/gm, "")}`); // Strip HTML for console readability
    console.log("==========================================");

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { success: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const fromName = process.env.SMTP_FROM_NAME || "UMS";
    const fromEmail = process.env.SMTP_FROM_EMAIL || "noreply@ums.local";

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent: %s", info.messageId);
    return { success: true, data: info };
  } catch (error) {
    console.error("Failed to send email via SMTP:", error);
    return { success: false, error };
  }
}
