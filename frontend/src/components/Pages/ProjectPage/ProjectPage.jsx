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
      <strong>{comment.username || comment.authorName}:</strong> {comment.content || comment.text}
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
  // ✅ FIXED: Get ideaId from the correct URL parameter
  const { domainId, ideaId } = useParams(); // Changed from just ideaId
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  const fetchComments = async () => {
    try {
      // ✅ FIXED: Use the correct API endpoint structure
      const res = await axios.get(`http://localhost:5000/api/comments/idea/${ideaId}`);
      setComments(res.data.data ? res.data.data.comments : res.data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  useEffect(() => {
    const fetchIdeaDetails = async () => {
      try {
        console.log('Fetching idea with ID:', ideaId); // Debug log
        
        // ✅ FIXED: Use the correct API endpoint
        const response = await axios.get(`http://localhost:5000/api/ideas/${ideaId}`);
        console.log('Idea response:', response.data); // Debug log
        
        // ✅ FIXED: Handle different response formats
        const ideaData = response.data.data ? response.data.data.idea : response.data;
        setIdea(ideaData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching idea details:", error);
        setError("Failed to load idea details. Please try again later.");
        setLoading(false);
      }
    };
    
    if (ideaId) {
      fetchIdeaDetails();
      fetchComments();
    }
  }, [ideaId]);

  const handleAddComment = async (parentId = null, text) => {
    if (text.trim()) {
      try {
        const token = localStorage.getItem('token');
        const commentData = {
          content: text, 
          parentComment: parentId
        };
        
        // ✅ FIXED: Use the correct API endpoint with proper headers
        await axios.post(`http://localhost:5000/api/comments/idea/${ideaId}`, commentData, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        });
        
        setNewComment("");
        fetchComments();
      } catch (error) {
        console.error("Error adding comment:", error);
        alert("Failed to add comment. Please make sure you're logged in.");
      }
    }
  };

  const handleLike = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("Please log in to like ideas");
        return;
      }

      // ✅ FIXED: Correct API endpoint and headers
      const response = await axios.post(`http://localhost:5000/api/ideas/${ideaId}/like`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // ✅ FIXED: Handle different response formats
      const updatedIdea = response.data.data ? response.data.data.idea : response.data;
      setIdea(prevIdea => ({
        ...prevIdea,
        stats: updatedIdea.stats || prevIdea.stats,
        likeCount: updatedIdea.likeCount || prevIdea.likeCount
      }));
    } catch (error) {
      console.error("Error liking idea:", error);
      alert("Failed to like idea. Please make sure you're logged in.");
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
            
            {/* ✅ FIXED: Detailed description section */}
            {idea.detailedDescription && (
              <div className="detailed-description">
                <h3>Detailed Description</h3>
                <p>{idea.detailedDescription}</p>
              </div>
            )}
            
            {/* ✅ FIXED: Using correct image field names */}
            {idea.projectImage && (
              <div className="project-images">
                <h3>Main Image</h3>
                <img 
                  src={`http://localhost:5000${idea.projectImage}`} 
                  alt="Project main image" 
                  onError={(e) => {
                    console.error('Image failed to load:', e.target.src);
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            {idea.additionalImages && idea.additionalImages.length > 0 && (
              <div className="project-images">
                <h3>Additional Images</h3>
                {idea.additionalImages.map((imageObj, index) => (
                  <div key={index}>
                    <img 
                      src={`http://localhost:5000${imageObj.url || imageObj}`} 
                      alt={imageObj.caption || `Project image ${index + 1}`} 
                      onError={(e) => {
                        console.error('Additional image failed to load:', e.target.src);
                        e.target.style.display = 'none';
                      }}
                    />
                    {imageObj.caption && <p>{imageObj.caption}</p>}
                  </div>
                ))}
              </div>
            )}
            
            {/* ✅ FIXED: Tags display */}
            {idea.tags && idea.tags.length > 0 && (
              <div className="project-tags">
                <h3>Tags</h3>
                <div className="tags-container">
                  {idea.tags.map((tag, index) => (
                    <span key={index} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}
            
            {/* ✅ FIXED: Required skills display */}
            {idea.requiredSkills && idea.requiredSkills.length > 0 && (
              <div className="required-skills">
                <h3>Required Skills</h3>
                <div className="skills-container">
                  {idea.requiredSkills.map((skillObj, index) => (
                    <span key={index} className="skill">
                      {typeof skillObj === 'object' ? skillObj.skill : skillObj}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* ✅ FIXED: Related links */}
            {idea.relatedLinks && idea.relatedLinks.length > 0 && (
              <div className="related-links">
                <h3>Related Links</h3>
                <ul>
                  {idea.relatedLinks.map((linkObj, index) => (
                    <li key={index}>
                      <a href={linkObj.url || linkObj} target="_blank" rel="noopener noreferrer">
                        {linkObj.title || linkObj.url || linkObj}
                      </a>
                      {linkObj.description && <p>{linkObj.description}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* ✅ FIXED: PDF document */}
            {idea.projectPdf && (
              <div className="research-papers">
                <h3>Project Document</h3>
                <div className="pdf-container">
                  <a 
                    href={`http://localhost:5000${idea.projectPdf.path || idea.projectPdf}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="pdf-link"
                  >
                    📄 {idea.projectPdf.originalName || "View Project Document"}
                  </a>
                </div>
              </div>
            )}
          </div>
          
          <div className="content-box">
            <h2>📅 Date</h2>
            <p>{new Date(idea.createdAt).toLocaleDateString()}</p>
          </div>

          <div className="content-box">
            <h2>⚙️ Project Info</h2>
            <p><strong>Difficulty:</strong> {idea.difficulty}</p>
            <p><strong>Category:</strong> {idea.category}</p>
            {idea.estimatedDuration && (
              <p><strong>Estimated Duration:</strong> {idea.estimatedDuration.value} {idea.estimatedDuration.unit}</p>
            )}
          </div>

          <div className="content-box">
            <h2>❤️ Likes & Collaboration</h2>
            <p>
              {idea.stats?.totalLikes || idea.likeCount || 0} likes • {' '}
              {idea.collaborationInterests?.length || 0} collaboration interests
            </p>
            <button onClick={handleLike} className="like-button">
              👍 I'm Interested!
            </button>
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
          {idea.author && (
            <div className="author-info">
              <div className="author-avatar">
                <img 
                  src={
                    idea.author.profileImage 
                      ? `http://localhost:5000${idea.author.profileImage}` 
                      : "https://via.placeholder.com/80"
                  } 
                  alt={idea.author.authorName}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/80";
                  }}
                />
              </div>
              <div className="author-text">
                <h3>{idea.author.authorName}</h3>
                <p>Email: {idea.author.authorEmail || idea.author.contactInfo?.email || 'N/A'}</p>
                <p>Bio: {idea.author.bio || "No bio available."}</p>
                {idea.author.organization && (
                  <p>Organization: {idea.author.organization}</p>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default ProjectPage;