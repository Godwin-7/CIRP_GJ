import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./ProjectPage.css";

const ProjectPage = () => {
  const { domainId, ideaId } = useParams();
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [author, setAuthor] = useState(null);
  const [authorLoading, setAuthorLoading] = useState(true);

  useEffect(() => {
    const fetchIdeaDetails = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/domains/${domainId}/ideas/${ideaId}`
        );
        setIdea(response.data);
        setLoading(false);
        
        // After fetching idea, fetch matching author
        if (response.data && response.data.topic) {
          fetchAuthor(response.data.topic);
        } else {
          setAuthorLoading(false);
        }
      } catch (error) {
        console.error("Error fetching idea details:", error);
        setError("Failed to load idea details. Please try again later.");
        setLoading(false);
        setAuthorLoading(false);
      }
    };

    const fetchAuthor = async (topic) => {
      try {
        const response = await axios.get(`http://localhost:5000/authors/topic/${topic}`);
        if (response.data.authorName) {
          setAuthor(response.data.authorName);
        } else {
          setAuthor(null);
        }
        setAuthorLoading(false);
      } catch (error) {
        console.error("Error fetching author:", error);
        setAuthorLoading(false);
      }
    };

    fetchIdeaDetails();
  }, [domainId, ideaId]);

  const handleAddComment = () => {
    if (newComment.trim()) {
      setComments((prev) => [...prev, newComment]);
      setNewComment("");
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!idea) {
    return <div className="error">Idea not found.</div>;
  }

  return (
    <div className="project-page">
      <header className="project-header">
        <h1>{idea.topic || "Untitled Project"}</h1>
        <p className="project-subtitle">
          {idea.description || "No description available."}
        </p>
      </header>

      <div className="project-container">
        <div className="project-details">
          <div className="content-box">
            <h2>📄 Project Details</h2>
            <p>{idea.details || "No details available."}</p>
          </div>

          <div className="content-box">
            <h2>📂 Document</h2>
            {idea?.content ? (
              <iframe
                src={`http://localhost:5000/uploads/${idea.content
                  .split("\\")
                  .pop()}#toolbar=0&view=FitH`}
                className="document-iframe"
                title="Project Document"
              ></iframe>
            ) : (
              <p>No document available</p>
            )}
            {idea?.content && (
              <div className="download-container">
                <a
                  href={`http://localhost:5000/uploads/${idea.content
                    .split("\\")
                    .pop()}`}
                  download
                  className="download-button"
                >
                  Download Full Document
                </a>
              </div>
            )}
          </div>

          <div className="content-box">
            <h2>📅 Date</h2>
            <p>
              {idea.submittedAt
                ? new Date(idea.submittedAt).toLocaleDateString()
                : "Unknown date"}
            </p>
          </div>

          <div className="content-box">
            <h2>✅ Status</h2>
            <p>{idea.status || "In Progress"}</p>
          </div>

          {/* Comments Section */}
          <div className="content-box">
            <h2>💬 Comments</h2>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="comment-input"
            ></textarea>

            <button onClick={handleAddComment} className="add-comment-button">
              Add Comment
            </button>

            <div className="comment-list">
              {comments.length > 0 ? (
                comments.map((comment, index) => (
                  <div key={index} className="comment-card">
                    {comment}
                  </div>
                ))
              ) : (
                <p>No comments yet.</p>
              )}
            </div>
          </div>
        </div>

        <aside className="author-box">
  <h2>👤 Author</h2>
  {authorLoading ? (
    <div className="author-loading">Loading author information...</div>
  ) : author ? (
    <div className="author-info">
      <div className="author-avatar">
        <img
          src="https://via.placeholder.com/80"
          alt={author}
        />
      </div>
      <div className="author-text">
        <h3>{author}</h3>
      </div>
    </div>
  ) : (
    <div className="author-info">
      <div className="author-avatar">
        <img
          src="https://via.placeholder.com/80"
          alt="Unknown Author"
        />
      </div>
      <div className="author-text">
        <h3>Unknown Author</h3>
        <p>No author information available for this topic.</p>
      </div>
    </div>
  )}
</aside>
      </div>
    </div>
  );
};

export default ProjectPage;