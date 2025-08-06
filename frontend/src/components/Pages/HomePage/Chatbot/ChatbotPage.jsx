import React, { useState, useEffect, useRef } from "react";

const ChatbotPage = () => {
  const [conversations, setConversations] = useState([]);
  const [currentConversationIndex, setCurrentConversationIndex] = useState(null);
  const [currentConversation, setCurrentConversation] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameInput, setRenameInput] = useState("");
  const [renameIndex, setRenameIndex] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation]);

  useEffect(() => {
    // Initialize with a default conversation if none exist
    if (conversations.length === 0) {
      const defaultConversation = {
        name: "Welcome Chat",
        messages: [
          {
            type: "response",
            text: "Hello! I'm Godwin's AI Assistant. How can I help you today?",
            timestamp: new Date().toISOString()
          }
        ]
      };
      setConversations([defaultConversation]);
      setCurrentConversationIndex(0);
      setCurrentConversation(defaultConversation.messages);
    }
  }, []);

  const saveCurrentConversation = () => {
    if (currentConversationIndex !== null) {
      const updatedConversations = [...conversations];
      updatedConversations[currentConversationIndex] = {
        name: updatedConversations[currentConversationIndex]?.name || `Chat ${currentConversationIndex + 1}`,
        messages: [...currentConversation],
      };
      setConversations(updatedConversations);
    }
  };

  // Real AI API Integration
  const generateResponse = async (userMessage) => {
    try {
      // Option 1: OpenAI GPT API (Recommended)
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${import.meta.env.OPENAI_API_KEY}' // Replace with your API key
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo", // or "gpt-4" for better responses
          messages: [
            {
              role: "system",
              content: "You are Godwin's AI Assistant, a helpful, knowledgeable, and friendly AI chatbot. Provide detailed, accurate, and helpful responses to user questions."
            },
            {
              role: "user",
              content: userMessage
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;

    } catch (error) {
      console.error('AI API Error:', error);
      
      // Fallback to local responses if API fails
      return getFallbackResponse(userMessage);
    }
  };

  // Fallback responses when API is unavailable
  const getFallbackResponse = (userMessage) => {
    const message = userMessage.toLowerCase().trim();
    
    // Enhanced local AI-like responses
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return "Hello! I'm Godwin's AI Assistant. I'm here to help you with questions, provide information, solve problems, or just have a conversation. What would you like to know about?";
    }
    
    if (message.includes('explain') || message.includes('what is') || message.includes('how does')) {
      return "I'd be happy to explain that topic to you! However, I'm currently running in offline mode. For the best experience with complex explanations, please ensure the AI API is properly configured. In the meantime, I can help with basic questions and calculations.";
    }
    
    // Math calculations
    if (/\d+\s*[\+\-\*\/]\s*\d+/.test(message)) {
      try {
        const mathMatch = message.match(/(\d+(?:\.\d+)?)\s*([\+\-\*\/])\s*(\d+(?:\.\d+)?)/);
        if (mathMatch) {
          const [, num1, operator, num2] = mathMatch;
          const a = parseFloat(num1);
          const b = parseFloat(num2);
          let result;
          switch (operator) {
            case '+': result = a + b; break;
            case '-': result = a - b; break;
            case '*': result = a * b; break;
            case '/': result = b !== 0 ? a / b : 'undefined (division by zero)'; break;
            default: result = 'invalid operation';
          }
          return `The answer is: ${result}`;
        }
      } catch (e) {
        return "I can help with math problems! Please format your question like 'What is 5 + 3?' or 'Calculate 10 * 7'.";
      }
    }
    
    if (message.includes('thank you') || message.includes('thanks')) {
      return "You're very welcome! I'm glad I could help. Feel free to ask me anything else you're curious about!";
    }
    
    // Default response for complex questions
    return "I understand you're asking about something complex. To provide you with detailed, accurate answers like ChatGPT or Claude, I need to be connected to an AI API. Currently running in offline mode with basic responses. Please configure the API integration for full AI capabilities!";
  };

  const appendMessage = (type, text) => {
    const newMessage = { type, text, timestamp: new Date().toISOString() };
    setCurrentConversation((prev) => {
      const updated = [...prev, newMessage];
      return updated;
    });
  };

  const sendMessage = async () => {
    const text = messageInput.trim();
    if (!text) return;
    
    appendMessage("user", text);
    setMessageInput("");
    setIsTyping(true);

    // Get AI response (now async)
    try {
      const response = await generateResponse(text);
      appendMessage("response", response);
      setIsTyping(false);
      
      // Save conversation after both messages are added
      setTimeout(() => saveCurrentConversation(), 100);
    } catch (error) {
      console.error('Error getting response:', error);
      appendMessage("response", "Sorry, I encountered an error. Please try again.");
      setIsTyping(false);
    }
  };

  const handleNewChat = () => {
    saveCurrentConversation();
    const newConversation = {
      name: `Chat ${conversations.length + 1}`,
      messages: [{
        type: "response",
        text: "Hello! I'm ready for a new conversation. What would you like to talk about or learn today?",
        timestamp: new Date().toISOString()
      }],
    };
    setConversations((prev) => [...prev, newConversation]);
    setCurrentConversationIndex(conversations.length);
    setCurrentConversation(newConversation.messages);
  };

  const handleRenameConversation = () => {
    const newName = renameInput.trim();
    if (newName && renameIndex !== null) {
      const updatedConversations = [...conversations];
      updatedConversations[renameIndex].name = newName;
      setConversations(updatedConversations);
    }
    setRenameModalOpen(false);
    setRenameIndex(null);
    setRenameInput("");
  };

  const handleDeleteConversation = (index) => {
    if (confirm("Are you sure you want to delete this conversation?")) {
      const updatedConversations = conversations.filter((_, i) => i !== index);
      setConversations(updatedConversations);
      
      if (currentConversationIndex === index) {
        if (updatedConversations.length > 0) {
          const newIndex = Math.min(index, updatedConversations.length - 1);
          setCurrentConversationIndex(newIndex);
          setCurrentConversation(updatedConversations[newIndex].messages);
        } else {
          setCurrentConversationIndex(null);
          setCurrentConversation([]);
        }
      } else if (currentConversationIndex > index) {
        setCurrentConversationIndex(currentConversationIndex - 1);
      }
    }
  };

  const openRenameModal = (index) => {
    setRenameIndex(index);
    setRenameInput(conversations[index].name);
    setRenameModalOpen(true);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#001f3f',
      fontFamily: 'Poppins, sans-serif',
      color: '#e7eaee'
    }}>
      {/* Welcome Banner */}
      <div style={{
        backgroundColor: '#0d2d50',
        padding: '20px',
        textAlign: 'center',
        boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{
            fontSize: '1.5rem',
            color: '#e7eaee'
          }}>
            Welcome, <span style={{color: '#e7eaee'}}>User</span>!
          </span>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '900',
            color: '#cc1e4a',
            margin: 0
          }}>
            Godwin's AI Assistant
          </h1>
          <div style={{
            fontSize: '1.2rem',
            color: '#e7eaee'
          }}>
            RESPONSIVE MULTI-FUNCTIONAL CHATBOT
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <div style={{
          backgroundColor: '#0d2d50',
          width: '25%',
          color: '#e7eaee',
          padding: '20px',
          overflowY: 'auto'
        }}>
          <h5 style={{
            fontSize: '2rem',
            marginBottom: '20px',
            fontWeight: '600'
          }}>
            Conversations
          </h5>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            marginBottom: '20px'
          }}>
            {conversations.map((conv, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: index === currentConversationIndex ? '#cc1e4a' : '#001f3f',
                  border: '2px solid #cc1e4a',
                  padding: '10px',
                  borderRadius: '5px',
                  color: '#e7eaee',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => {
                  setCurrentConversationIndex(index);
                  setCurrentConversation(conv.messages);
                }}
                onMouseEnter={(e) => {
                  if (index !== currentConversationIndex) {
                    e.target.style.backgroundColor = '#cc1e4a';
                    e.target.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (index !== currentConversationIndex) {
                    e.target.style.backgroundColor = '#001f3f';
                    e.target.style.transform = 'translateY(0)';
                  }
                }}
              >
                <span style={{ flex: 1 }}>
                  {conv.name || `Chat ${index + 1}`}
                </span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span
                    style={{
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openRenameModal(index);
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#ffcc00'}
                    onMouseLeave={(e) => e.target.style.color = '#e7eaee'}
                  >
                    &#9998;
                  </span>
                  <span
                    style={{
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(index);
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#ff6b6b'}
                    onMouseLeave={(e) => e.target.style.color = '#e7eaee'}
                  >
                    &#128465;
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <button
            style={{
              backgroundColor: '#cc1e4a',
              color: '#e7eaee',
              border: 'none',
              padding: '10px',
              borderRadius: '5px',
              cursor: 'pointer',
              width: '100%',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'background-color 0.3s ease'
            }}
            onClick={handleNewChat}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e7eaee';
              e.target.style.color = '#cc1e4a';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#cc1e4a';
              e.target.style.color = '#e7eaee';
            }}
          >
            New Chat
          </button>
        </div>

        {/* Chat Area */}
        <div style={{
          width: '75%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '20px',
          backgroundColor: '#001f3f'
        }}>
          {/* Messages */}
          <div style={{
            flexGrow: 1,
            overflowY: 'auto',
            padding: '15px',
            borderRadius: '5px',
            marginBottom: '20px',
            backgroundColor: '#0d2d50'
          }}>
            {currentConversation.map((msg, index) => (
              <div
                key={index}
                style={{
                  padding: '12px',
                  marginBottom: '10px',
                  borderRadius: '15px',
                  maxWidth: '65%',
                  wordWrap: 'break-word',
                  boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.5)',
                  backgroundColor: msg.type === 'user' ? '#cc1e4a' : '#0d2d50',
                  color: '#e7eaee',
                  alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start',
                  marginLeft: msg.type === 'user' ? 'auto' : '0',
                  marginRight: msg.type === 'user' ? '0' : 'auto',
                  whiteSpace: 'pre-line'
                }}
              >
                {msg.text}
              </div>
            ))}
            
            {isTyping && (
              <div style={{
                padding: '12px',
                marginBottom: '10px',
                borderRadius: '15px',
                maxWidth: '65%',
                backgroundColor: '#0d2d50',
                color: '#e7eaee',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#cc1e4a',
                  borderRadius: '50%',
                  animation: 'bounce 1.4s ease-in-out 0s infinite both'
                }}></div>
                <div style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#cc1e4a',
                  borderRadius: '50%',
                  animation: 'bounce 1.4s ease-in-out 0.16s infinite both'
                }}></div>
                <div style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#cc1e4a',
                  borderRadius: '50%',
                  animation: 'bounce 1.4s ease-in-out 0.32s infinite both'
                }}></div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !isTyping && sendMessage()}
              placeholder="Type your message..."
              disabled={isTyping}
              style={{
                flex: '0 0 70%',
                padding: '10px',
                border: '2px solid #cc1e4a',
                borderRadius: '5px',
                backgroundColor: '#e7eaee',
                color: '#001f3f',
                fontSize: '1rem',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#ffcc00';
                e.target.style.boxShadow = '0px 10px 20px rgba(0, 0, 0, 0.5)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#cc1e4a';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button
              onClick={sendMessage}
              disabled={isTyping || !messageInput.trim()}
              style={{
                flex: '0 0 calc(30% - 10px)',
                backgroundColor: isTyping || !messageInput.trim() ? '#666' : '#cc1e4a',
                color: '#e7eaee',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: isTyping || !messageInput.trim() ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'background-color 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!isTyping && messageInput.trim()) {
                  e.target.style.backgroundColor = '#e7eaee';
                  e.target.style.color = '#cc1e4a';
                }
              }}
              onMouseLeave={(e) => {
                if (!isTyping && messageInput.trim()) {
                  e.target.style.backgroundColor = '#cc1e4a';
                  e.target.style.color = '#e7eaee';
                }
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Rename Modal */}
      {renameModalOpen && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#0d2d50',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.5)',
          zIndex: 10
        }}>
          <h3 style={{ marginBottom: '15px', color: '#e7eaee' }}>Rename Conversation</h3>
          <input
            type="text"
            value={renameInput}
            onChange={(e) => setRenameInput(e.target.value)}
            placeholder="Enter new conversation name"
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '10px',
              border: '2px solid #cc1e4a',
              borderRadius: '5px',
              backgroundColor: '#e7eaee',
              color: '#001f3f',
              fontSize: '1rem',
              outline: 'none'
            }}
            onKeyPress={(e) => e.key === "Enter" && handleRenameConversation()}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleRenameConversation}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#cc1e4a',
                color: '#e7eaee',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Save
            </button>
            <button
              onClick={() => {
                setRenameModalOpen(false);
                setRenameIndex(null);
                setRenameInput("");
              }}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#666',
                color: '#e7eaee',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes bounce {
            0%, 80%, 100% {
              transform: scale(0);
            } 40% {
              transform: scale(1);
            }
          }
        `}
      </style>
    </div>
  );
};

export default ChatbotPage;