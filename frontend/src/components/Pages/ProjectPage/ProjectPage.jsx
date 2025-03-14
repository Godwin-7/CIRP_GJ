import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./ProjectPage.css";

const ProjectPage = () => {
  const { topicId } = useParams();
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/topics/${topicId}`)
      .then((response) => {
        setTopic(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching topic details:", error);
        setLoading(false);
      });
  }, [topicId]);

  if (loading) return <div className="loading">Loading...</div>;
  if (!topic) return <div className="error">Topic not found.</div>;

  return (
    <div className="project-page">
      {/* Project Header */}
      <header className="project-header">
        <h1>{topic.title}</h1>
        <p className="project-subtitle">{topic.description}</p>
      </header>

      {/* Project Content */}
      <div className="project-container">
        {/* Left Side: Project Details */}
        <div className="project-details">
          <div className="content-box">
            <h2>📖 Detailed Explanation</h2>
            <p>{topic.content}</p>
          </div>

          <div className="published-papers content-box">
            <h2>📑 Published Papers</h2>
            <ul>
              {topic.publishedPapers.map((paper, index) => (
                <li key={index}>
                  <strong>{paper.title}</strong> - {paper.date}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Side: Author Profile */}
        <aside className="author-box">
          <h2>👤 Author</h2>
          <div className="author-info">
            <div className="author-avatar">{topic.author.name.charAt(0)}</div>
            <div className="author-text">
              <h3>{topic.author.name}</h3>
              <p>
                Email:{" "}
                <a href={`mailto:${topic.author.email}`}>
                  {topic.author.email}
                </a>
              </p>
              <p>Contact: {topic.author.contact}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ProjectPage;
