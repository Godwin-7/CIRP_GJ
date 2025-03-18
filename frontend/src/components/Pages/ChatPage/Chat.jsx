import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./Chat.css";

const Chat = () => {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const chatBoxRef = useRef(null);

  useEffect(() => {
    // Fetch user data from localStorage
    const storedUsername = localStorage.getItem("username") || "Guest";
    const storedEmail = localStorage.getItem("email") || "guest@example.com";

    setUsername(storedUsername);
    setEmail(storedEmail);

    // Connect socket only after fetching user data
    const socket = io("http://localhost:5000", {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("Connected to socket server");
      setIsConnected(true);
      socket.emit("getMessages");
    });

    socket.on("chatHistory", (messages) => {
      setChat(messages);
    });

    socket.on("receiveMessage", (message) => {
      setChat((prevChat) => [...prevChat, message]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Auto-scroll to the latest message whenever chat updates
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chat]);

  const sendMessage = () => {
    if (message.trim() !== "" && isConnected) {
      const socket = io("http://localhost:5000");
      socket.emit("sendMessage", { username, email, message });
      setMessage("");
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <h2 className="text-black text-3xl">Global Chat</h2>
      <div className="chat-box" ref={chatBoxRef}>
        {chat.map((msg, index) => (
          <div key={index} className="message">
            <strong>{msg.username}:</strong> {msg.message} <br />
            <small>{new Date(msg.timestamp).toLocaleString()}</small>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage} disabled={!isConnected}>
          {isConnected ? "Send" : "Connecting..."}
        </button>
      </div>
    </div>
  );
};

export default Chat;
