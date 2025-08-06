// ProjectPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./ProjectPage.css";

const Comment = ({ comment, onAddReply }) => {
  const [replyText, setReplyText] = useState("");
  const [showReplyInput, setShowReplyInput] = useState(false);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (replyText.trim()) {
      onAddReply(comment._id, replyText);
      setReplyText("");
      setShowReplyInput(false);
    }
  };

  return (
    <div className="comment-card">
      <strong>{comment.authorName}:</strong> {comment.text}
      <button onClick={() => setShowReplyInput(!showReplyInput)}>
        Reply
      </button>
      {showReplyInput && (
        <form onSubmit={handleReplySubmit} className="reply-form">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
          ></textarea>
          <button type="submit">Submit Reply</button>
        </form>
      )}
      <div className="comment-replies">
        {comment.replies && comment.replies.map((reply) => (
          <Comment key={reply._id} comment={reply} onAddReply={onAddReply} />
        ))}
      </div>
    </div>
  );
};

const ProjectPage = () => {
  const { ideaId } = useParams();
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

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
    fetchComments();
  }, [ideaId]);

  const handleAddComment = async (parentId = null, text) => {
    if (text.trim()) {
      try {
        const commentData = {
          // ✅ CORRECTED: Changed 'text' to 'content' to match backend controller
          content: text, 
          idea: ideaId,
          author: 'your_user_id_here', // Replace with dynamic user ID
          parentComment: parentId
        };
        await axios.post("http://localhost:5000/api/comments/create", commentData);
        setNewComment("");
        fetchComments();
      } catch (error) {
        console.error("Error adding comment:", error);
        alert("Failed to add comment.");
      }
    }
  };

  const handleLike = async () => {
    try {
      // ✅ CORRECTED: Changed from PUT to POST request
      const response = await axios.post(`http://localhost:5000/api/ideas/${ideaId}/like`);
      // ✅ CORRECTED: Update local state with the new data from the server's response
      setIdea(response.data);
    } catch (error) {
      console.error("Error liking idea:", error);
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
            <p>{idea.description}</p>
            {/* ✅ CORRECTED: Using 'mainImage' from the backend model */}
            {idea.mainImage && (
              <div className="project-images">
                <h3>Main Image</h3>
                <img src={`http://localhost:5000/${idea.mainImage}`} alt="Project main image" />
              </div>
            )}
            {idea.additionalImages && idea.additionalImages.length > 0 && (
              <div className="project-images">
                <h3>Additional Images</h3>
                {idea.additionalImages.map((image, index) => (
                  <img key={index} src={`http://localhost:5000/${image}`} alt={`Project image ${index + 1}`} />
                ))}
              </div>
            )}
            {idea.relatedLinks && idea.relatedLinks.length > 0 && (
              <div className="related-links">
                <h3>Related Links</h3>
                <ul>
                  {idea.relatedLinks.map((link, index) => (
                    <li key={index}>
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        {link.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* ✅ CORRECTED: Using 'projectPdf' from the backend model */}
            {idea.projectPdf && (
              <div className="research-papers">
                <h3>Research Papers</h3>
                <iframe src={`http://localhost:5000/${idea.projectPdf}`} title={`Research Paper`} />
              </div>
            )}
          </div>
          
          <div className="content-box">
            <h2>📅 Date</h2>
            {/* ✅ CORRECTED: Using createdAt timestamp from the backend */}
            <p>{new Date(idea.createdAt).toLocaleDateString()}</p>
          </div>

          <div className="content-box">
            <h2>❤️ Likes</h2>
            {/* ✅ CORRECTED: Accessing likes from the nested stats object */}
            <p>{idea.stats && idea.stats.totalLikes ? idea.stats.totalLikes : 0} collaboration interests</p>
            <button onClick={handleLike}>I'm Interested!</button>
          </div>

          <div className="content-box">
            <h2>💬 Comments</h2>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="comment-input"
            ></textarea>
            <button onClick={() => handleAddComment(null, newComment)} className="add-comment-button">
              Add Comment
            </button>
            <div className="comment-list">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <Comment key={comment._id} comment={comment} onAddReply={handleAddComment} />
                ))
              ) : (
                <p>No comments yet.</p>
              )}
            </div>
          </div>
        </div>

        <aside className="author-box">
          <h2>👤 Author</h2>
          {/* ✅ CORRECTED: Added a check for idea.author and used the correct nested fields */}
          {idea.author && (
            <div className="author-info">
              <div className="author-avatar">
                <img src={idea.author.profileImage || "https://via.placeholder.com/80"} alt={idea.author.authorName} />
              </div>
              <div className="author-text">
                <h3>{idea.author.authorName}</h3>
                <p>Email: {idea.author.contactInfo.email}</p>
                <p>Bio: {idea.author.bio || "No bio available."}</p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default ProjectPage;