const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const OpenAI = require("openai");
const { createAssistant } = require("./openai.service");
const twilio = require("twilio");
const MessagingResponse = require("twilio").twiml.MessagingResponse;

const app = express();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,  // Ensure this environment variable is set
});

const accountSid = "your_twilio_account_sid"; // Placeholder
const authToken = "your_twilio_auth_token";   // Placeholder
const twilioClient = twilio(accountSid, authToken);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

const threadStates = {};

const ValidateURL = "your_validate_url"; // Placeholder
const SecurityKey = "your_security_key"; // Placeholder
const StoreCode = "your_store_code"; // Placeholder
const CounterNo = "your_counter_no"; // Placeholder
const MerchantName = "your_merchant_name"; // Placeholder

const validateCustomer = async (number) => {
  const payload = {
    Security_Key: SecurityKey,
    Merchant_Code: MerchantName,
    Store_Code: StoreCode,
    Till_Number: CounterNo,
    Phone_Number: number,
    Payzana_CARD_No: "",
    Token: "",
    User: "your_user_id", // Placeholder
    Req_From: "RXL POS BW",
  };

  const headers = { "Content-Type": "application/json" };

  try {
    const response = await fetch(ValidateURL, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("API Response:", data);
    return data;
  } catch (error) {
    console.error("Error validating customer:", error);
    throw error;
  }
};

const startConversation = async () => {
  try {
    const thread = await openai.beta.threads.create();
    threadStates[thread.id] = {
      name: null,
      greeted: false,
      expectingPhoneNumber: false,
    };
    return { thread_id: thread.id };
  } catch (error) {
    console.error("Error starting conversation:", error);
    throw new Error(error);
  }
};

const handleChat = async (threadId, message) => {
  const assistant = await createAssistant(openai);
  const assistantId = assistant.id;

  if (!threadId) {
    throw new Error("Missing thread_id");
  }

  const threadState = threadStates[threadId];

  if (!threadState.greeted) {
    threadState.greeted = true;
    return { response: "Hey, how can I assist you today?" };
  }

  if (message.toLowerCase().includes("nearest") || message.toLowerCase().includes("closest")) {
    return { response: "Please provide your location." };
  }

  if (message.toLowerCase().includes("payzana")) {
    threadState.expectingPhoneNumber = true;
    return { response: "Please submit your phone number." };
  }

  if (threadState.expectingPhoneNumber) {
    threadState.expectingPhoneNumber = false;
    const phoneNumber = message.trim();
    console.log("Received phone number:", phoneNumber);

    try {
      const customerData = await validateCustomer(phoneNumber);

      if (customerData && customerData.Message === "Valid Customer") {
        return {
          response: "Yes, your number is registered. How can I assist you further?",
        };
      } else {
        return {
          response: "No, your number is not registered. \nPayzana has the following benefits: \n1. Buy airtime \n2. Buy electricity \n3. DSTV Subscription \n4. Send money to any Payzana user or active mobile number \n5. Cash deposits and withdrawals \n6. Quick QR code scanning to make payments at registered merchants \n7. Request money from Payzana registered customers using QR codes. \n\nWould you like to register?",
        };
      }
    } catch (error) {
      console.error("Error validating customer:", error);
      throw new Error(error);
    }
  }

  if (message.toLowerCase().includes("no") || message.toLowerCase().includes("thanks")) {
    return {
      response: "Thank you for chatting with us. Have a great day!",
    };
  }

  try {
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
    });

    const run = await openai.beta.threads.runs.createAndPoll(threadId, {
      assistant_id: assistantId,
    });

    const messages = await openai.beta.threads.messages.list(run.thread_id);
    const responseMessage = messages.data[0].content[0].text.value;

    let response = responseMessage;
    if (!threadState.greeted) {
      const userName = threadState.name;
      response = `Hey ${userName}, ${responseMessage}`;
      threadState.greeted = true;
    }

    response += "\nIs there anything else I can help you with today?";

    return { response };
  } catch (error) {
    console.error("Error handling chat:", error);
    throw new Error(error);
  }
};

const twilioWebhook = async (req, res) => {
  try {
    const incomingMessage = req.body.Body;
    const from = req.body.From;

    let threadId;

    if (!threadStates[from]) {
      const startConvo = await startConversation();
      threadId = startConvo.thread_id;
      threadStates[from] = threadId;
    } else {
      threadId = threadStates[from];
    }

    const responseFromAI = (await handleChat(threadId, incomingMessage)).response;
    console.log(responseFromAI);

    twilioClient.messages
      .create({
        body: responseFromAI,
        from: "whatsapp:+14155238886",
        to: from,
      })
      .then((message) => {
        res.send("<Response></Response>");
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error sending message");
      });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error processing message");
  }
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

(async () => {
  try {
    app.get("/start", startConversation);
    app.post("/chat", handleChat);
    app.post("/whatsapp", twilioWebhook);

    app.listen(8080, () => {
      console.log("Server running on port 8080");
    });
  } catch (error) {
    console.error("Error initializing the assistant:", error);
  }
})();
