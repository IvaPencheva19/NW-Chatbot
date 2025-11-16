# NW-Chatbot

This is backend project that use TypeScript, Restify and
WebSockets to manage a dynamic chatbot flow based on a JSON configuration. This
backend allow users to upload and download chatbot flow configurations, process
conversations in real time, integrate with OpenAI for intent detection and maintain a history of user interactions.
This app use MongoDB to store the configation for the chatbot and the history of conversations.

## Steps to run the project:

1. npm build
2. npm run start

## For developing:

1. npm run dev

## With Docker:

1. docker-compose build --no-cache
2. docker-compose up

HTTP server and WebSocket will be both running on port 4000.

## REST endpoints for configiuring chatbot (testing on local: http://localhost:4000):

### 1. Get chatbot confiuration in JSON format

**GET /chatbot/config**

Example request:

```
curl --location --request GET 'http://localhost:4000/chatbot/config'
```

Expected response:

- HTTP status 200 OK
- Body: JSON configuration as in the request body in POST request below

---

### 2. Rewrite chatbot configuration

**POST /chatbot/config**

Example request:

```
curl --location --request POST 'http://localhost:4000/chatbot/config' --header 'Content-Type: application/json' --data-raw '{ "id": "travel_assistant_v1", ... }'
```

Expected response:

```
HTTP status 200 OK
{
"message": "Chatbot config saved"
}
```

---

## REST endpoints for conversation history

### 1. Get all conversations

**GET /chatbot/history**

Example request:

```
curl --location --request GET 'http://localhost:4000/chatbot/history'
```

Example response:
HTTP status 200 OK

```
[{
"_id": "691985c0b4c2efc0913bcba5",
"sessionId": "session_1763280320820_utfrj9h9u9k",
"messages": [
{
"sender": "bot",
"message": "Hi! I'm your Travel Assistant. How can I help you today?",
"blockId": "welcome",
"timestamp": "2025-11-16T08:05:20.835Z",
"_id": "691985c0b4c2efc0913bcba7"
},
//more messages here
]
},
//more sessions here
]
```

---

### 2. Get conversation history

**GET /chatbot/history/:sessionId**

Example request:

```
curl --location --request GET 'http://localhost:4000/chatbot/history/session_1763279144526_h44jz79ph8'
```

Example response:
HTTP status 200 OK

```
{
"_id": "691985c0b4c2efc0913bcba5",
"sessionId": "session_1763280320820_utfrj9h9u9k",
"messages": [
{
"sender": "bot",
"message": "Hi! I'm your Travel Assistant. How can I help you today?",
"blockId": "welcome",
"timestamp": "2025-11-16T08:05:20.835Z",
"_id": "691985c0b4c2efc0913bcba7"
},
//more messages here
]
}
```

---

### 3. Get messages from conversation history paginated

**GET /chatbot/history/:sessionId/paginated**

Example request:

```
curl --location --request GET 'http://localhost:4000/chatbot/history/session_1763279144526_h44jz79ph8/paginated?skip=0&limit=4'
```

Example response:
HTTP status 200 OK

```
{
"_id": "691985c0b4c2efc0913bcba5",
"sessionId": "session_1763280320820_utfrj9h9u9k",
"messages": [
{
"sender": "bot",
"message": "Hi! I'm your Travel Assistant. How can I help you today?",
"blockId": "welcome",
"timestamp": "2025-11-16T08:05:20.835Z",
"_id": "691985c0b4c2efc0913bcba7"
},
// 3 more messages here
]
}
```
---

## WebSocket comunnication (chat with chatbot) 

### WebSocket Example - test in browser console

1. Open the browser console and paste:

```
const ws = new WebSocket("ws://localhost:4000");
ws.onmessage = (e) => console.log("Bot says:", e.data);
```

Bot will send initial message:

```
Bot says: {"type":"bot_message","message":"Hi! I'm your Travel Assistant. How can I help you today?"}
```

2. Ask chat bot something - send message via websocket:

```
ws.send("Can you give me travel offers?")
```

3. Bot will answer something like this:

```
Bot says: {"type":"bot_message","message":"The best offer is now for Paris. - https://www.booking.com/city/fr/paris.html
 Do you need anything else?"}
```

4. You can send:

```
ws.send("yes")
```

Bot will respond:

```
Bot says: {"type":"info","message":"Waiting for your response..."}
```

Then you can send your next message:

```
ws.send("Where to eat today")
```

OR you can send:

```
ws.send("no")
```

Bot says:

```
Bot says: {"type":"bot_message","message":"Thanks, bye!"}
```

This will end the conversation.

---



