"use client";

import React, { useState } from 'react';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ sender: string; text: string }[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async () => {
    if (message.trim() === '') return;

    const userMessage = { sender: 'user', text: message };
    setChatHistory((prev) => [...prev, userMessage]);
    setMessage('');
    setIsSending(true);
    setError(null);

    try {
      const response = await fetch('/api/chatbot-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message.trim() }),
      });

      const apiResponse = await response.json();
      if (!response.ok) {
        throw new Error(`Erreur lors de l'envoi du message: ${apiResponse.message || response.statusText}`);
      }

      const chatbotResponseText = apiResponse.n8nResponse?.output || "Aucune réponse du chatbot.";
      setChatHistory((prev) => [...prev, { sender: 'system', text: chatbotResponseText }]);

    } catch (err: Error) {
      console.error("Erreur d'envoi du message:", err);
      setError("Impossible d'envoyer le message.");
      setChatHistory((prev) => [...prev, { sender: 'system', text: "Erreur: Impossible d'envoyer le message." }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && (
        <div className="bg-white shadow-lg rounded-lg w-80 h-96 flex flex-col border border-gray-200">
          <div className="bg-blue-600 text-white p-3 rounded-t-lg flex justify-between items-center">
            <h3 className="font-bold">Chatbot Media Start</h3>
            <button onClick={toggleChat} className="text-white text-xl leading-none">
              &times;
            </button>
          </div>
          <div className="flex-1 p-3 overflow-y-auto space-y-2">
            {chatHistory.length === 0 ? (
              <p className="text-gray-500 text-center text-sm">Commencez à discuter !</p>
            ) : (
              chatHistory.map((msg, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-lg max-w-[80%] ${
                    msg.sender === 'user'
                      ? 'bg-blue-100 text-blue-800 self-end ml-auto'
                      : 'bg-gray-100 text-gray-800 self-start mr-auto'
                  }`}
                >
                  {msg.text}
                </div>
              ))
            )}
            {isSending && (
              <div className="p-2 rounded-lg bg-gray-100 text-gray-600 self-start mr-auto text-sm">
                Envoi en cours...
              </div>
            )}
            {error && (
              <div className="p-2 rounded-lg bg-red-100 text-red-700 self-start mr-auto text-sm">
                {error}
              </div>
            )}
          </div>
          <div className="p-3 border-t border-gray-200 flex">
            <input
              type="text"
              className="flex-1 border border-gray-300 rounded-l-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Écrivez votre message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
              disabled={isSending}
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-600 text-white rounded-r-lg px-4 py-2 text-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSending}
            >
              Envoyer
            </button>
          </div>
        </div>
      )}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
