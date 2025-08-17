import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import "./Chat.css";

const Chat = ({ domainId = null }) => {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInitialized, setUserInitialized] = useState(false);
  const chatBoxRef = useRef(null);

  // Function to get current user data with better error handling and no fallback to hardcoded names
  const getCurrentUser = async () => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.log("No authentication token found");
        throw new Error("No authentication token found");
      }

      console.log("🔍 Fetching current user data from server...");
      
      // Always fetch fresh user data from server to ensure we get the correct user
      const response = await axios.get("http://localhost:5000/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("🔍 Server response:", response.data);

      if (response.data.success && response.data.data && response.data.data.user) {
        const userData = response.data.data.user;
        
        console.log("✅ User data from server:", {
          username: userData.username,
          email: userData.email,
          id: userData.id || userData._id,
          fullName: userData.fullName
        });

        // Update localStorage with fresh data
        localStorage.setItem("userData", JSON.stringify(userData));
        localStorage.setItem("username", userData.username);
        localStorage.setItem("email", userData.email);
        
        // Set user state with server data
        setUsername(userData.username || "");
        setEmail(userData.email || "");
        setUserId(userData.id || userData._id || "");
        setUserInitialized(true);
        
        console.log("👤 User initialized successfully:", {
          username: userData.username,
          email: userData.email,
          id: userData.id || userData._id
        });
        
        return userData;
      } else {
        console.error("❌ Invalid response from server:", response.data);
        throw new Error("Invalid user verification response");
      }

    } catch (error) {
      console.error("❌ Error getting current user:", error);
      
      // Clear any stale data
      localStorage.removeItem("userData");
      localStorage.removeItem("username");
      localStorage.removeItem("email");
      localStorage.removeItem("token");
      
      // Don't set fallback user data - instead redirect to login
      setError("Authentication required. Please log in.");
      setUserInitialized(false);
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
      
      throw error;
    }
  };

  // Initialize user data on component mount
  useEffect(() => {
    const initializeUser = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        await getCurrentUser();
      } catch (error) {
        console.error("Failed to initialize user:", error);
        setError("Failed to authenticate user. Redirecting to login...");
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, []); // Only run once on mount

  // Initialize socket connection after user is initialized
  useEffect(() => {
    if (!userInitialized || !username || !email) {
      console.log("⏳ User not fully initialized yet, waiting...", { 
        userInitialized, 
        hasUsername: !!username, 
        hasEmail: !!email 
      });
      return;
    }

    console.log("🔌 Initializing socket connection...", { 
      username, 
      email, 
      domainId,
      chatType: domainId ? 'domain' : 'global'
    });

    // Create socket connection with enhanced error handling
    const newSocket = io("http://localhost:5000", {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    newSocket.on("connect", () => {
      console.log("✅ Connected to socket server");
      setIsConnected(true);
      setIsLoading(false);
      setError(null);
      
      // Clear any existing chat when switching contexts
      setChat([]);
      
      if (domainId) {
        console.log("🏠 Joining domain chat:", domainId);
        newSocket.emit("joinDomain", domainId);
        // Add small delay to ensure room join is processed
        setTimeout(() => {
          newSocket.emit("getDomainMessages", domainId);
        }, 100);
      } else {
        console.log("🌍 Joining global chat");
        newSocket.emit("getMessages");
      }
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from socket server:", reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        newSocket.connect();
      }
    });

    newSocket.on("connect_error", (error) => {
      console.error("🚫 Connection error:", error);
      setIsConnected(false);
      setIsLoading(false);
      setError("Failed to connect to chat server");
    });

    newSocket.on("reconnect", (attemptNumber) => {
      console.log("🔄 Reconnected after", attemptNumber, "attempts");
      setError(null);
    });

    newSocket.on("reconnect_error", (error) => {
      console.error("🔄❌ Reconnection failed:", error);
      setError("Reconnection failed");
    });

    // Global chat history - only process if not in domain mode
    newSocket.on("chatHistory", (messages) => {
      console.log("📜 Received global chat history:", messages?.length || 0, "messages");
      if (!domainId && Array.isArray(messages)) {
        const formattedMessages = messages.map(msg => ({
          _id: msg._id,
          username: msg.username,
          message: msg.message || msg.content,
          timestamp: msg.timestamp || msg.createdAt,
          messageType: 'global'
        }));
        setChat(formattedMessages);
        setIsLoading(false);
      }
    });

    // Domain chat history - only process if in domain mode
    newSocket.on("domainChatHistory", (messages) => {
      console.log("🏠📜 Received domain chat history:", messages?.length || 0, "messages");
      if (domainId && Array.isArray(messages)) {
        const formattedMessages = messages.map(msg => ({
          _id: msg._id,
          username: msg.username,
          message: msg.message || msg.content,
          timestamp: msg.timestamp || msg.createdAt,
          messageType: 'domain',
          domainId: msg.domainId
        }));
        setChat(formattedMessages);
        setIsLoading(false);
      }
    });

    // New global messages - only process if not in domain mode
    newSocket.on("receiveMessage", (newMessage) => {
      console.log("📨 New global message:", newMessage.username);
      if (!domainId) {
        const formattedMessage = {
          _id: newMessage._id,
          username: newMessage.username,
          message: newMessage.message || newMessage.content,
          timestamp: newMessage.timestamp || newMessage.createdAt,
          messageType: 'global'
        };
        setChat(prevChat => [...prevChat, formattedMessage]);
      }
    });

    // New domain messages - only process if domainId matches
    newSocket.on("receiveDomainMessage", (newMessage) => {
      console.log("🏠📨 New domain message:", newMessage.username, "for domain:", newMessage.domainId);
      if (domainId && newMessage.domainId === domainId) {
        const formattedMessage = {
          _id: newMessage._id,
          username: newMessage.username,
          message: newMessage.message || newMessage.content,
          timestamp: newMessage.timestamp || newMessage.createdAt,
          messageType: 'domain',
          domainId: newMessage.domainId
        };
        setChat(prevChat => [...prevChat, formattedMessage]);
      }
    });

    // Enhanced error handling
    newSocket.on("messageError", (error) => {
      console.error("💬❌ Message error:", error);
      setError(`Failed to send message: ${error.error}`);
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    });

    setSocket(newSocket);

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up socket connection");
      newSocket.removeAllListeners();
      newSocket.disconnect();
    };
  }, [domainId, userInitialized, username, email]); // Re-initialize when domainId or user data changes

  // Auto-scroll to latest message
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chat]);

  const sendMessage = () => {
    const trimmedMessage = message.trim();
    
    if (!trimmedMessage) {
      console.warn("⚠️ Empty message, ignoring");
      return;
    }

    if (!isConnected || !socket) {
      console.warn("⚠️ Cannot send message - not connected");
      setError("Not connected to chat server");
      return;
    }

    if (!username || !email) {
      console.warn("⚠️ Cannot send message - user not initialized");
      setError("User information not loaded");
      return;
    }

    console.log("📤 Sending message:", {
      username,
      email,
      messageLength: trimmedMessage.length,
      chatType: domainId ? 'domain' : 'global',
      domainId
    });
    
    const messageData = {
      username,
      email,
      message: trimmedMessage,
      domainId: domainId || null,
      timestamp: new Date()
    };

    if (domainId) {
      console.log("📤🏠 Sending domain message to:", domainId);
      socket.emit("sendDomainMessage", messageData);
    } else {
      console.log("📤🌍 Sending global message");
      socket.emit("sendMessage", messageData);
    }
    
    setMessage("");
    setError(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        day: 'numeric',
        hour12: true
      });
    } catch (e) {
      console.warn("Error formatting timestamp:", e);
      return "";
    }
  };

  const getConnectionStatusColor = () => {
    if (isLoading) return "🟡 Connecting...";
    if (!isConnected) return "🔴 Disconnected";
    return "🟢 Connected";
  };

  const getChatTitle = () => {
    if (domainId) return "Domain Chat";
    return "Global Chat";
  };

  const getPlaceholderText = () => {
    if (!isConnected) return "Connecting to chat...";
    if (!userInitialized) return "Loading user information...";
    return `Type your message in ${domainId ? 'domain' : 'global'} chat... (Press Enter to send)`;
  };

  // Show error screen if authentication failed
  if (error && error.includes("Authentication required")) {
    return (
      <div className="global-chat-container">
        <div className="global-chat-error-screen">
          <div className="global-chat-error-icon">🔒</div>
          <h3>Authentication Required</h3>
          <p>{error}</p>
          <button onClick={() => window.location.href = "/login"}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show loading screen if user is not initialized
  if (!userInitialized || isLoading) {
    return (
      <div className="global-chat-container">
        <div className="global-chat-loading-messages">
          <div className="global-chat-spinner"></div>
          <p>Loading chat and user information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="global-chat-container">
      <div className="global-chat-header">
        <h2 className="text-black text-3xl">{getChatTitle()}</h2>
        <div className="global-chat-connection-status">
          <span className={`global-chat-status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {getConnectionStatusColor()}
          </span>
        </div>
        {error && (
          <div className="global-chat-error-banner">
            ⚠️ {error}
          </div>
        )}
      </div>
      
      <div className="global-chat-box" ref={chatBoxRef}>
        {isLoading ? (
          <div className="global-chat-loading-messages">
            <div className="global-chat-spinner"></div>
            <p>Loading chat history...</p>
          </div>
        ) : chat.length > 0 ? (
          chat.map((msg, index) => (
            <div key={msg._id || index} className={`global-chat-message ${msg.username === username ? 'own-message' : ''}`}>
              <div className="global-chat-message-header">
                <strong className="global-chat-username">{msg.username}</strong>
                <small className="global-chat-timestamp">
                  {formatTimestamp(msg.timestamp)}
                </small>
              </div>
              <div className="global-chat-message-content">{msg.message}</div>
            </div>
          ))
        ) : (
          <div className="global-chat-no-messages">
            {isConnected ? 
              `No messages yet in this ${domainId ? 'domain' : 'global'} chat. Start the conversation! 💬` : 
              "Connecting to chat..."
            }
          </div>
        )}
      </div>
      
      <div className="global-chat-input">
        <div className="global-chat-input-group">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={getPlaceholderText()}
            rows="2"
            disabled={!isConnected || !userInitialized || isLoading}
            maxLength={1000}
          />
          <button 
            onClick={sendMessage} 
            disabled={!isConnected || !message.trim() || isLoading || !userInitialized}
            className={`global-chat-send-button ${isConnected && message.trim() && !isLoading && userInitialized ? 'active' : 'inactive'}`}
          >
            {isLoading ? "Loading..." : isConnected ? "Send" : "Connecting..."}
          </button>
        </div>
        <div className="global-chat-info">
          <small>
            Chatting as: <strong>{username}</strong> in <strong>{domainId ? 'Domain' : 'Global'}</strong> chat
            {!isConnected && " (Trying to reconnect...)"}
            {message.length > 0 && ` • ${message.length}/1000 characters`}
          </small>
        </div>
      </div>
    </div>
  );
};

export default Chat;