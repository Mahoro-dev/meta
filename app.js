const express = require('express');
const axios = require('axios'); // Remember to run: yarn add axios
const app = express();

app.use(express.json());

const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;
const whatsappToken = process.env.WHATSAPP_TOKEN; 
const phoneNumberId = process.env.PHONE_NUMBER_ID;

// GET: Webhook Verification
app.get('/', (req, res) => {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('WEBHOOK VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.status(403).end();
  }
});

// POST: Handle Incoming Messages & Reply
app.post('/', async (req, res) => {
  const body = req.body;

  if (body.object === 'whatsapp_business_account') {
    if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
      
      const message = body.entry[0].changes[0].value.messages[0];
      const from = message.from; 
      const msgText = message.text ? message.text.body : "Received a non-text message";

      console.log(`Incoming message from ${from}: "${msgText}"`);

      try {
        // CALL META GRAPH API TO REPLY
        await axios({
          method: "POST",
          url: `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
          data: {
            messaging_product: "whatsapp",
            to: from,
            type: "text",
            text: { body: `You said: ${msgText}` }, // This is the echo reply
          },
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${whatsappToken}`,
          },
        });
        console.log("Reply sent successfully!");
      } catch (err) {
        console.error("Error sending reply:", err.response ? err.response.data : err.message);
      }
    }
    res.status(200).end();
  } else {
    res.status(404).end();
  }
});

app.listen(port, () => {
  console.log(`\nServer is active on port ${port}\n`);
});