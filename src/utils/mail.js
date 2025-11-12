import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async(options) => {
    const mailGenerator = new Mailgen({
        theme: "default",
        product: {
            name: "TaskManager",
            link: "http://taskmanage.com"
        }
    });
    
    const mailTextual = mailGenerator.generatePlaintext(options.mailgenContent);
    const mailHtml = mailGenerator.generate(options.mailgenContent);

    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_SMTP_HOST,
        port: process.env.MAILTRAP_SMTP_PORT,
        auth: {
            user: process.env.MAILTRAP_SMTP_USER,
            pass: process.env.MAILTRAP_SMTP_PASS
        }
    });

    const mail = {
        from: "mail.taskmanager@example.com",
        to: options.email,
        subject: options.subject,
        text: mailTextual,
        html: mailHtml
    }

    try {
        await transporter.sendMail(mail);
    } catch(error) {
        console.error("Mail service failed silently, check if the credentials are correct");
        console.error(error);
    }
}

const emailVerificationMailgenContent = (username, verificationUrl) => {
    return {
        body: {
            name: `Hello ${username}`,
            intro: "Welcome to ProjectCamp! It is a RESTful API service designed to support collaborative project management.",
            action: {
                instructions: "We are excited to have you on-board and there's just one step to verify if it's actually your e-mail address:",
                button: {
                    color: "#22BC66",
                    text: "Verify Account",
                    link: verificationUrl
                }
            },
            outro: "Need help, or have questions? Just reply to this email, we'd love to help."
        }
    }
};

const passwordResetMailgenContent = (username, passwordResetUrl) => {
    return {
        body: {
            name: `Hello ${username}`,
            intro: "We received a request to reset your password.",
            action: {
                instructions: "In-order to reset your password please click on the button provided below",
                button: {
                    color: "#22BC66",
                    text: "Reset Password",
                    link: passwordResetUrl
                }
            },
            outro: "Need help, or have questions? Just reply to this email, we'd love to help."
        }
    }
};

export {emailVerificationMailgenContent, passwordResetMailgenContent, sendEmail}; 