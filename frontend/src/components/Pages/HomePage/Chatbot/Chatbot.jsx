import React from "react";
import "./Chatbot.css";

const Chatbot = () => {
  const openChatbot = () => {
    window.open("/chatbot", "_blank");
  };

  return (
    <section id="chatbot" className="chatbot-section">
      <div className="chatbot-content">
        <div className="chatbot-description">
          <h2>AI-Powered Chatbot</h2>
          <p>
            Our AI-powered chatbot is designed to assist you with your queries,
            provide information, and help you navigate through the platform. It
            supports multiple conversations, allows you to rename or delete
            chats, and provides real-time responses.
          </p>
          <button onClick={openChatbot} className="chatbot-button">
            Click to Open Chatbot
          </button>
        </div>
        <div className="chatbot-image">
          <img src="/images/chatbot-image.png" alt="Chatbot" />
        </div>
      </div>
    </section>
  );
};

export default Chatbot;
