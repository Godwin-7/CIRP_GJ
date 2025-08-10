import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./Chat.css";

const Chat = () => {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const chatBoxRef = useRef(null);

  useEffect(() => {
    // Fetch user data from localStorage
    const storedUsername = localStorage.getItem("username") || "Guest";
    const storedEmail = localStorage.getItem("email") || "guest@example.com";

    setUsername(storedUsername);
    setEmail(storedEmail);

    // ✅ FIXED: Create socket connection properly
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
      // ✅ FIXED: Get global messages instead of just "getMessages"
      newSocket.emit("getMessages");
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from socket server");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setIsConnected(false);
    });

    // ✅ FIXED: Listen for chat history
    newSocket.on("chatHistory", (messages) => {
      console.log("Received chat history:", messages);
      setChat(Array.isArray(messages) ? messages : []);
    });

    // ✅ FIXED: Listen for new messages
    newSocket.on("receiveMessage", (newMessage) => {
      console.log("Received new message:", newMessage);
      setChat((prevChat) => [...prevChat, newMessage]);
    });

    setSocket(newSocket);

    // Cleanup function
    return () => {
      newSocket.removeAllListeners();
      newSocket.disconnect();
    };
  }, []);

  // Auto-scroll to the latest message whenever chat updates
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chat]);

  const sendMessage = () => {
    if (message.trim() !== "" && isConnected && socket) {
      console.log("Sending message:", { username, email, message });
      
      // ✅ FIXED: Use the existing socket connection
      socket.emit("sendMessage", { 
        username, 
        email, 
        message: message.trim(),
        timestamp: new Date()
      });
      
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

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2 className="text-black text-3xl">Global Chat</h2>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </div>
      </div>
      
      <div className="chat-box" ref={chatBoxRef}>
        {chat.length > 0 ? (
          chat.map((msg, index) => (
            <div key={index} className="message">
              <div className="message-header">
                <strong className="username">{msg.username}</strong>
                <small className="timestamp">
                  {new Date(msg.timestamp).toLocaleString()}
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
            placeholder="Type your message... (Press Enter to send)"
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
            Chatting as: <strong>{username}</strong> 
            {!isConnected && " (Trying to reconnect...)"}
          </small>
        </div>
      </div>
    </div>
  );
};

export default Chat;