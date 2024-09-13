# Chatbot Project

## Overview

This project is a dynamic chatbot application built using Node.js, Express, and OpenAI's API. It includes integration with Twilio for SMS-based user interactions. The chatbot can handle various user queries and provide responses based on predefined instructions and documents.

## Features

- **Chatbot Functionality**: Provides interactive conversations using OpenAI's API.
- **SMS Integration**: Utilizes Twilio for sending and receiving SMS messages.
- **Document-Based Knowledge**: Loads knowledge from documents for enhancing responses.
- **Local File Storage**: Stores assistant details in a local JSON file.

## Prerequisites

- Node.js (>=14.x)
- npm (Node Package Manager)
- Twilio Account (for SMS integration)
- OpenAI API Key
- Knowledge Documents (place in the `knowledge_docs` directory)

## Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/your-repository.git
   cd your-repository
   
2. **Install Dependencies**
   npm install

3. **Set Up Environment Variables**

  Create a .env file in the root directory of the project and add the following:
    OPENAI_API_KEY=your_openai_api_key
    TWILIO_ACCOUNT_SID=your_twilio_account_sid
    TWILIO_AUTH_TOKEN=your_twilio_auth_token

4. **Prepare Knowledge Documents**
   
  Place your knowledge documents in the knowledge_docs directory. The documents will be used to enhance the chatbot's responses.


## Endpoints

/start: Initializes a new conversation.
/chat: Handles chat messages. Requires threadId and message parameters.
/whatsapp: Handles incoming messages from Twilio and responds via SMS.


Make sure to replace placeholders like `your-username`, `your-repository`, `your_openai_api_key`, `your_twilio_account_sid`, `your_twilio_auth_token`, and contact information with your actual details.


## Contact
For any questions or inquiries, please contact:
Preet Kuthati: preetkuthati5@gmail.com

