const keys = require("../config/dev");
const nodemailer = require("nodemailer");

module.exports = app => {
  app.post("/api/mail", function(req, res, next) {
    const name = req.body.name;
    const email = req.body.email;
    const subject = req.body.subject;
    const message = req.body.message;
    console.log(email + name + subject);
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "kokulekan23@gmail.com",
        pass: "rose1969"
      }
    });

    const mailOptions = {
      from: email,
      to: "kokulekan23@gmail.com",
      subject: subject,
      text: message
    };
    console.log(mailOptions);
    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        res.status(500).send({ error: "an error ;" });
      } else {
        res.status(200).send({ success: "Mail Sent" });
      }
    });
  });
};
