import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./ProjectPage.css";

const ProjectPage = () => {
  const { ideaId } = useParams(); // Removed domainId from params
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // Function to fetch comments for the specific idea
  const fetchComments = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/comments/idea/${ideaId}`);
      setComments(res.data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  useEffect(() => {
    const fetchIdeaDetails = async () => {
      try {
        // ✅ Updated API endpoint to directly fetch idea by ID
        const response = await axios.get(`http://localhost:5000/api/ideas/${ideaId}`);
        setIdea(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching idea details:", error);
        setError("Failed to load idea details. Please try again later.");
        setLoading(false);
      }
    };

    fetchIdeaDetails();
    fetchComments(); // Fetch comments when the page loads
  }, [ideaId]);

  const handleAddComment = async () => {
    if (newComment.trim()) {
      try {
        const commentData = {
          text: newComment,
          idea: ideaId,
          // You should get the user's ID from authentication context
          // For now, let's use a placeholder
          author: 'your_user_id_here' 
        };
        // ✅ New endpoint for adding a comment
        await axios.post("http://localhost:5000/api/comments/create", commentData);
        setNewComment("");
        fetchComments(); // Re-fetch comments to show the new one
      } catch (error) {
        console.error("Error adding comment:", error);
        alert("Failed to add comment.");
      }
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
        <h1>{idea.title || "Untitled Project"}</h1>
        <p className="project-subtitle">
          {idea.description || "No description available."}
        </p>
      </header>

      <div className="project-container">
        <div className="project-details">
          <div className="content-box">
            <h2>📄 Project Details</h2>
            <p>{idea.description || "No details available."}</p>
          </div>
          
          {/* ✅ Updated to use 'projectPdf' field */}
          <div className="content-box">
            <h2>📂 Document</h2>
            {idea?.projectPdf ? (
              <iframe
                src={`http://localhost:5000/${idea.projectPdf}`}
                className="document-iframe"
                title="Project Document"
              ></iframe>
            ) : (
              <p>No document available</p>
            )}
            {idea?.projectPdf && (
              <div className="download-container">
                <a
                  href={`http://localhost:5000/${idea.projectPdf}`}
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
            {/* The new backend has a moderation field */}
            <p>{idea.moderation || "Pending"}</p>
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
                comments.map((comment) => (
                  <div key={comment._id} className="comment-card">
                    <strong>{comment.author}:</strong> {comment.text}
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
          {idea.author ? (
            <div className="author-info">
              <div className="author-avatar">
                <img
                  src="https://via.placeholder.com/80"
                  alt={idea.author.authorName}
                />
              </div>
              <div className="author-text">
                <h3>{idea.author.authorName}</h3>
                <p>{idea.author.bio}</p>
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
                <p>No author information available.</p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default ProjectPage;