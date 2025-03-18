import React, { useState, useEffect } from "react";
import "./ChatbotPage.css";

const ChatbotPage = () => {
  const [conversations, setConversations] = useState([]);
  const [currentConversationIndex, setCurrentConversationIndex] =
    useState(null);
  const [currentConversation, setCurrentConversation] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameInput, setRenameInput] = useState("");

  useEffect(() => {
    const savedConversations =
      JSON.parse(localStorage.getItem("conversations")) || [];
    setConversations(savedConversations);
    if (savedConversations.length > 0) {
      setCurrentConversationIndex(0);
      setCurrentConversation(savedConversations[0].messages);
    }
  }, []);

  const saveCurrentConversation = () => {
    if (currentConversationIndex !== null) {
      const updatedConversations = [...conversations];
      updatedConversations[currentConversationIndex] = {
        name:
          updatedConversations[currentConversationIndex]?.name ||
          `Chat ${currentConversationIndex + 1}`,
        messages: [...currentConversation],
      };
      setConversations(updatedConversations);
      localStorage.setItem(
        "conversations",
        JSON.stringify(updatedConversations)
      );
    }
  };

  const appendMessage = (type, text, save = true) => {
    const newMessage = { type, text };
    setCurrentConversation((prev) => [...prev, newMessage]);
    if (save) {
      saveCurrentConversation();
    }
  };

  const sendMessage = async () => {
    const text = messageInput.trim();
    if (!text) return;
    appendMessage("user", text);
    setMessageInput("");

    const response = await fetch("/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    const data = await response.json();
    appendMessage("response", data.response || "Error fetching response.");
  };

  const handleNewChat = () => {
    saveCurrentConversation();
    const newConversation = {
      name: `Chat ${conversations.length + 1}`,
      messages: [],
    };
    setConversations((prev) => [...prev, newConversation]);
    setCurrentConversationIndex(conversations.length);
    setCurrentConversation([]);
  };

  const handleRenameConversation = (index) => {
    const newName = renameInput.trim();
    if (newName) {
      const updatedConversations = [...conversations];
      updatedConversations[index].name = newName;
      setConversations(updatedConversations);
      localStorage.setItem(
        "conversations",
        JSON.stringify(updatedConversations)
      );
    }
    setRenameModalOpen(false);
  };

  const handleDeleteConversation = (index) => {
    if (confirm("Are you sure you want to delete this conversation?")) {
      const updatedConversations = conversations.filter((_, i) => i !== index);
      setConversations(updatedConversations);
      localStorage.setItem(
        "conversations",
        JSON.stringify(updatedConversations)
      );
      if (currentConversationIndex === index) {
        setCurrentConversationIndex(updatedConversations.length ? 0 : null);
        setCurrentConversation(
          updatedConversations.length ? updatedConversations[0].messages : []
        );
      }
    }
  };

  return (
    <div className="chatbot-page">
      <div className="welcome-banner">
        <div className="title-container">
          <span className="welcome-text">
            Welcome, <span className="username">User</span>!
          </span>
          <h1 className="main-title">Godwin's AI Assistant</h1>
          <div className="subtitle">RESPONSIVE MULTI-FUNCTIONAL CHATBOT</div>
        </div>
      </div>

      <div className="container-fluid">
        <div className="sidebar">
          <h5>Conversations</h5>
          <div className="conversation-list">
            {conversations.map((conv, index) => (
              <div
                key={index}
                className={`chat-button ${
                  index === currentConversationIndex ? "active-chat" : ""
                }`}
                onClick={() => {
                  setCurrentConversationIndex(index);
                  setCurrentConversation(conv.messages);
                }}
              >
                {conv.name || `Chat ${index + 1}`}
                <div className="icon-container">
                  <span
                    className="edit-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenameModalOpen(true);
                      setRenameInput(conv.name);
                    }}
                  >
                    &#9998;
                  </span>
                  <span
                    className="delete-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(index);
                    }}
                  >
                    &#128465;
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button className="new-chat-button" onClick={handleNewChat}>
            New Chat
          </button>
        </div>

        <div className="chat-area">
          <div className="messages">
            {currentConversation.map((msg, index) => (
              <div key={index} className={`message ${msg.type}`}>
                {msg.text}
              </div>
            ))}
          </div>
          <div className="input-group">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type your message..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      </div>

      {renameModalOpen && (
        <div className="modal">
          <input
            type="text"
            value={renameInput}
            onChange={(e) => setRenameInput(e.target.value)}
            placeholder="Enter new conversation name"
          />
          <button
            onClick={() => handleRenameConversation(currentConversationIndex)}
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatbotPage;
