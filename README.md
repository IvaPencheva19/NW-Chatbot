# NW-Chatbot

This is backend project that use TypeScript, Restify and
WebSockets to manage a dynamic chatbot flow based on a JSON configuration. This
backend allow users to upload and download chatbot flow configurations, process
conversations in real time, integrate with OpenAI for intent detection and maintain a history of user interactions.
This app use MongoDB to store the configation for the chatbot and the history of conversations.

Steps to run the project:
1.npm build
2.npm run start

For developing:
1.npm run dev

With Docker:
1.docker-compose build --no-cache
2.docker-compose up

HTTP server and WebSocket will be both running on port 4000.

REST endpoints for getting/rewriting the chatbot config and endpoints for history can be tested with Postman. WebSocket comunnication (chat with chatbot) can be tested in the browser. Example:

1.Open the browser console and paste:
const ws = new WebSocket("ws://localhost:4000");
ws.onmessage = (e) => console.log("Bot says:", e.data);

Bot will send initial message:
Bot says: {"type":"bot_message","message":"Hi! I'm your Travel Assistant. How can I help you today?"}

2.Ask chat bot something - send message via websocket
ws.send("Can you give me travel offers?")

3.Bot will answer something like this:
Bot says: {"type":"bot_message","message":"The best offer is now for Paris. - https://www.booking.com/city/fr/paris.html\n Do you need anything else?"}

4.You can send:
ws.send("yes")
Bot will respond: Bot says: {"type":"info","message":"Waiting for your response..."}
And then you can send your next message: ws.send("Where to eat today")

OR you can send:
ws.send("no")
Bot says: {"type":"bot_message","message":"Thanks, bye!"}
This will end the conversation.

REST endpoints for configiuring chatbot (testing on local: http://localhost:4000):
1.Get chatbot confiuration in JSON format
GET /chatbot/config

Example request:
curl --location --request GET 'http://localhost:4000/chatbot/config'

Expected response:
HTTP status 200 OK
Body: JSON configuration as in the request body in POST request below

2.Rewrite chatbot configuration
POST /chatbot/config

Example request:

curl --location --request POST 'http://localhost:4000/chatbot/config' \
--header 'Content-Type: application/json' \
--data-raw '{
"id": "travel_assistant_v1",
"name": "Travel Assistant Chatbot",
"description": "A chatbot that provides travel offers, weather info, and restaurant recommendations.",
"start_block": "welcome",
"blocks": {
"welcome": {
"id": "welcome",
"type": "write_message",
"message": "Hi! I'\''m your Travel Assistant. How can I help you today?",
"next": "wait_for_user"
},
"wait_for_user": {
"id": "wait_for_user",
"type": "wait_for_response",
"next": "detect_intent_main"
},
"detect_intent_main": {
"id": "detect_intent_main",
"type": "detect_intent",
"intents": [
{
"name": "weather",
"examples": [
"What'\''s the weather?",
"Tell me the weather forecast",
"Give me the weather"
],
"next": "weather_info"
},
{
"name": "travel_offers",
"examples": [
"Show me travel offers",
"Any flight discounts?",
"Vacation deals"
],
"next": "travel_offer_info"
},
{
"name": "restaurant_recommendations",
"examples": [
"Recommend a restaurant",
"Where should I eat?",
"Find restaurants nearby"
],
"next": "restaurant_info"
}
],
"fallback_next": "unknown_intent"
},
"weather_info": {
"id": "weather_info",
"type": "write_message",
"message": "The weather in Varna is cold and rainy. ",
"next": "ask_more"
},
"travel_offer_info": {
"id": "travel_offer_info",
"type": "write_message",
"message": "The best offer is now for Paris. - https://www.booking.com/city/fr/paris.html",
"next": "ask_more"
},
"restaurant_info": {
"id": "restaurant_info",
"type": "write_message",
"message": "I recoomend you to eat in restaurant Happy.",
"next": "ask_more"
},
"ask_more": {
"id": "ask_more",
"type": "write_message",
"message": "Do you need anything else?",
"next": "wait_for_yesno"
},
"wait_for_yesno": {
"id": "wait_for_yesno",
"type": "wait_for_response",
"next": "detect_intent_yesno"
},
"detect_intent_yesno": {
"id": "detect_intent_yesno",
"type": "detect_intent",
"intents": [
{ "name": "yes", "examples": ["Yes", "Sure"], "next": "wait_for_user" },
{ "name": "no", "examples": ["No", "Thanks"], "next": "goodbye" }
],
"fallback_next": "unknown_intent"
},
"goodbye": {
"id": "goodbye",
"type": "write_message",
"message": "Thanks, bye!",
"next": "end"
},
"unknown_intent": {
"id": "unknown_intent",
"type": "write_message",
"message": "Sorry, I didn’t quite get that. Could you rephrase?",
"next": "wait_for_user"
},
"end": {
"id": "end",
"type": "end"
}
}
}
'

Expected response:
HTTP status 200 OK
Body: {
"message": "Chatbot config saved"
}

REST endpoints for conversation history
1.Get all conversations
GET /chatbot/history

Example request:
curl --location --request GET 'http://localhost:4000/chatbot/history'

Example response:
HTTP status 200 OK
Body:
[{
"\_id": "691985c0b4c2efc0913bcba5",
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

2.Get conversation history
GET /chatbot/history/:sessionId

Example request:
curl --location --request GET 'http://localhost:4000/chatbot/history/session_1763279144526_h44jz79ph8'

Example response:
HTTP status 200 OK
{
"\_id": "691985c0b4c2efc0913bcba5",
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

3.Get messages from conversation history paginated
GET /chatbot/history/:sessionId/paginated

Example request:
curl --location --request GET 'http://localhost:4000/chatbot/history/session_1763279144526_h44jz79ph8/paginated?skip=0&limit=4'

Example response:
HTTP status 200 OK
{
"\_id": "691985c0b4c2efc0913bcba5",
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
