const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const upload = multer(); // To handle multipart/form-data

const app = express();
const port = 5000;


// Allow requests from specific origin
app.use(cors({ origin: 'http://localhost:3000' }));

// Or, allow all origins (less secure)
app.use(cors());

// Middleware to parse JSON body
app.use(bodyParser.json());



// Email sending endpoint
app.post('/send-email', upload.single('photoStrip'), async (req, res) => {
  try {
    const { email } = req.body; // Recipient email
    const photoStrip = req.file; // Uploaded file

    // Configure Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Use your email provider
      auth: {
        user: 'photostripmachine@gmail.com', // Replace with your email
        pass: 'talx mbeu qrvn zpsh',   // Replace with your email password or app-specific password
      },
    });

    // Send the email with attachment
    const mailOptions = {
      from: 'photostripmachine@gmail.com',
      to: email,
      subject: 'Your Photostrip',
      text: 'Here is your photostrip!',
      attachments: [
        {
          filename: 'photo_strip.png',
          content: photoStrip.buffer,
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    res.status(200).send('Email sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('Failed to send email');
  }
});

// Start the server
app.listen(5000, () => {
  console.log('Server is running on http://localhost:5000');
});