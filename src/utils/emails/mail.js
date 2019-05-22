const sgMail = require('@sendgrid/mail');

// const SENDGRID_API_KEY = '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';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
// sgMail.setApiKey(SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'unofficialaks@gmail.com',
        subject: 'Thanks for joining in!',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
    });
}

const sendCancelationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'unofficialaks@gmail.com',
        subject: 'Sorry to see you go!',
        text: `Goodbye, ${name}. I hope to see you back sometime soon.`
    });
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}