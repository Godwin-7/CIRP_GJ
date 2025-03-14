import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./TitlePage.css";

const TitlePage = () => {
  const { domainId, level } = useParams();
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Convert `domainId` to lowercase before sending API request
    axios
      .get(
        `http://localhost:5000/api/domains/${domainId.toLowerCase()}/topics`,
        {
          params: { level: level || "all" },
        }
      )
      .then((response) => {
        console.log("API Response:", response.data); // Debugging
        if (Array.isArray(response.data)) {
          setTopics(response.data);
        } else {
          setError("Unexpected response format.");
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error(
          "Error fetching topics:",
          error.response ? error.response.data : error.message
        );
        setError("Error fetching topics. Please try again.");
        setLoading(false);
      });
  }, [domainId, level]);

  // Redirect to ProjectPage when a topic is clicked
  const handleTopicClick = (topicId) => {
    navigate(`/domains/${domainId}/${level}/${topicId}`);
  };

  if (loading) return <div className="loading">Loading topics...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="title-page">
      <h1 className="title-page-title">
        {domainId.charAt(0).toUpperCase() + domainId.slice(1)} -{" "}
        {level || "All Levels"}
      </h1>
      <h2 className="title-subtitle">Topics in this domain:</h2>

      {topics.length === 0 ? (
        <p className="no-topics">No topics available for this level.</p>
      ) : (
        <div className="topics-container">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="topic-card"
              onClick={() => handleTopicClick(topic.id)}
            >
              <div className="topic-content">
                <h2 className="topic-title">{topic.title}</h2>
                <p className="topic-description">
                  Explore more about {topic.title}.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TitlePage;
