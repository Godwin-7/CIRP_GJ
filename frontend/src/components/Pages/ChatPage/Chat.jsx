import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./Chat.css";

const Chat = ({ domainId = null }) => {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const chatBoxRef = useRef(null);

  useEffect(() => {
    // Get user data from localStorage or use defaults
    const storedUsername = localStorage.getItem("username") || "Guest";
    const storedEmail = localStorage.getItem("email") || "guest@example.com";

    setUsername(storedUsername);
    setEmail(storedEmail);

    // Create socket connection
    const newSocket = io("http://localhost:5000", {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("Connected to socket server");
      setIsConnected(true);
      
      // Join domain room if domainId is provided
      if (domainId) {
        newSocket.emit("joinDomain", domainId);
        newSocket.emit("getDomainMessages", domainId);
      } else {
        // Get global messages
        newSocket.emit("getMessages");
      }
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from socket server");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setIsConnected(false);
    });

    // Listen for chat history (global)
    newSocket.on("chatHistory", (messages) => {
      console.log("Received global chat history:", messages);
      if (Array.isArray(messages)) {
        setChat(messages.map(msg => ({
          _id: msg._id,
          username: msg.username,
          message: msg.message || msg.content,
          timestamp: msg.timestamp || msg.createdAt,
          messageType: msg.messageType || 'global'
        })));
      }
    });

    // Listen for domain chat history
    newSocket.on("domainChatHistory", (messages) => {
      console.log("Received domain chat history:", messages);
      if (Array.isArray(messages)) {
        setChat(messages.map(msg => ({
          _id: msg._id,
          username: msg.username,
          message: msg.message || msg.content,
          timestamp: msg.timestamp || msg.createdAt,
          messageType: msg.messageType || 'domain'
        })));
      }
    });

    // Listen for new global messages
    newSocket.on("receiveMessage", (newMessage) => {
      console.log("Received new global message:", newMessage);
      if (!domainId) { // Only add to chat if we're in global mode
        const formattedMessage = {
          _id: newMessage._id,
          username: newMessage.username,
          message: newMessage.message || newMessage.content,
          timestamp: newMessage.timestamp || newMessage.createdAt,
          messageType: newMessage.messageType || 'global'
        };
        setChat(prevChat => [...prevChat, formattedMessage]);
      }
    });

    // Listen for new domain messages
    newSocket.on("receiveDomainMessage", (newMessage) => {
      console.log("Received new domain message:", newMessage);
      if (domainId && newMessage.domainId === domainId) {
        const formattedMessage = {
          _id: newMessage._id,
          username: newMessage.username,
          message: newMessage.message || newMessage.content,
          timestamp: newMessage.timestamp || newMessage.createdAt,
          messageType: newMessage.messageType || 'domain'
        };
        setChat(prevChat => [...prevChat, formattedMessage]);
      }
    });

    // Listen for message errors
    newSocket.on("messageError", (error) => {
      console.error("Message error:", error);
      alert("Failed to send message: " + error.error);
    });

    setSocket(newSocket);

    // Cleanup function
    return () => {
      newSocket.removeAllListeners();
      newSocket.disconnect();
    };
  }, [domainId]);

  // Auto-scroll to the latest message whenever chat updates
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chat]);

  const sendMessage = () => {
    if (message.trim() !== "" && isConnected && socket) {
      console.log("Sending message:", { username, email, message, domainId });
      
      const messageData = {
        username,
        email,
        message: message.trim(),
        domainId: domainId || null,
        timestamp: new Date()
      };

      if (domainId) {
        // Send domain-specific message
        socket.emit("sendDomainMessage", messageData);
      } else {
        // Send global message
        socket.emit("sendMessage", messageData);
      }
      
      setMessage("");
    } else {
      console.warn("Cannot send message:", {
        hasMessage: message.trim() !== "",
        isConnected,
        hasSocket: !!socket
      });
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2 className="text-black text-3xl">
          {domainId ? "Domain Chat" : "Global Chat"}
        </h2>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </div>
      </div>
      
      <div className="chat-box" ref={chatBoxRef}>
        {chat.length > 0 ? (
          chat.map((msg, index) => (
            <div key={msg._id || index} className="message">
              <div className="message-header">
                <strong className="username">{msg.username}</strong>
                <small className="timestamp">
                  {formatTimestamp(msg.timestamp)}
                </small>
              </div>
              <div className="message-content">{msg.message}</div>
            </div>
          ))
        ) : (
          <div className="no-messages">
            {isConnected ? "No messages yet. Start the conversation!" : "Connecting to chat..."}
          </div>
        )}
      </div>
      
      <div className="chat-input">
        <div className="input-group">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Type your message in ${domainId ? 'domain' : 'global'} chat... (Press Enter to send)`}
            rows="2"
            disabled={!isConnected}
          />
          <button 
            onClick={sendMessage} 
            disabled={!isConnected || !message.trim()}
            className={`send-button ${isConnected && message.trim() ? 'active' : 'inactive'}`}
          >
            {isConnected ? "Send" : "Connecting..."}
          </button>
        </div>
        <div className="chat-info">
          <small>
            Chatting as: <strong>{username}</strong> in {domainId ? 'Domain' : 'Global'} chat
            {!isConnected && " (Trying to reconnect...)"}
          </small>
        </div>
      </div>
    </div>
  );
};

export default Chat;