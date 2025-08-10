import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./ProjectPage.css";

const Comment = ({ comment, onAddReply, level = 0 }) => {
  const [replyText, setReplyText] = useState("");
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  // Load replies when "View Replies" is clicked - YouTube style
  const loadReplies = async () => {
    if (replies.length === 0 && comment.replyCount > 0) {
      setLoadingReplies(true);
      try {
        const response = await axios.get(`http://localhost:5000/api/comments/thread/${comment._id}`);
        if (response.data.success && response.data.data.replies) {
          setReplies(response.data.data.replies);
        }
      } catch (error) {
        console.error("Error loading replies:", error);
      }
      setLoadingReplies(false);
    }
    setShowReplies(!showReplies);
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (replyText.trim()) {
      const success = await onAddReply(comment._id, replyText);
      if (success) {
        setReplyText("");
        setShowReplyInput(false);
        // Refresh replies after adding a new one
        if (showReplies) {
          setReplies([]);
          await loadReplies();
        } else {
          // Increment reply count locally
          comment.replyCount = (comment.replyCount || 0) + 1;
        }
      }
    }
  };

  return (
    <div className={`comment-card ${level > 0 ? 'comment-reply' : ''}`}>
      <div className="comment-header">
        <div className="comment-author">
          <img 
            src="https://via.placeholder.com/32" 
            alt={comment.author?.username || comment.authorName}
            className="comment-avatar"
          />
          <strong>{comment.author?.username || comment.authorName}</strong>
        </div>
        <span className="comment-time">
          {new Date(comment.createdAt).toLocaleDateString()}
        </span>
      </div>
      
      <div className="comment-content">
        {comment.content || comment.text}
      </div>
      
      <div className="comment-actions">
        {/* Only show Reply button for main comments (level 0) */}
        {level === 0 && (
          <button 
            className="reply-btn"
            onClick={() => setShowReplyInput(!showReplyInput)}
          >
            Reply
          </button>
        )}
        
        {/* Show "View Replies" button only for main comments with replies */}
        {level === 0 && comment.replyCount > 0 && (
          <button 
            className="view-replies-btn"
            onClick={loadReplies}
            disabled={loadingReplies}
          >
            {loadingReplies ? 'Loading...' : 
             showReplies ? 'Hide Replies' : 
             `View Replies (${comment.replyCount})`}
          </button>
        )}
      </div>

      {/* Reply Input - Only show for main comments */}
      {level === 0 && showReplyInput && (
        <form onSubmit={handleReplySubmit} className="reply-form">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            rows="3"
          />
          <div className="reply-form-actions">
            <button type="submit" className="submit-reply-btn">Submit Reply</button>
            <button 
              type="button" 
              onClick={() => setShowReplyInput(false)}
              className="cancel-reply-btn"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Show Replies (YouTube style - only when expanded) */}
      {showReplies && (
        <div className="comment-replies">
          {replies.map((reply) => (
            <Comment 
              key={reply._id} 
              comment={reply} 
              onAddReply={onAddReply}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ProjectPage = () => {
  const { domainId, ideaId } = useParams();
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // Fetch MAIN comments only (no replies) - YouTube style
  const fetchComments = async () => {
    try {
      // Fetch only main comments (no replies included)
      const res = await axios.get(`http://localhost:5000/api/comments/idea/${ideaId}`);
      if (res.data.success) {
        setComments(res.data.data.comments || []);
      } else {
        console.error("Failed to fetch comments:", res.data.message);
        setComments([]);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      setComments([]);
    }
  };

  useEffect(() => {
    const fetchIdeaDetails = async () => {
      try {
        console.log('Fetching idea with ID:', ideaId);
        
        const response = await axios.get(`http://localhost:5000/api/ideas/${ideaId}`);
        console.log('Idea response:', response.data);
        
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
          content: text.trim()
        };
        
        // If parentId is provided, it's a reply
        if (parentId) {
          commentData.parentComment = parentId;
        }
        
        const response = await axios.post(
          `http://localhost:5000/api/comments/idea/${ideaId}`, 
          commentData, 
          {
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.success) {
          // If it's a main comment (no parentId), refresh the main comments
          if (!parentId) {
            setNewComment("");
            await fetchComments();
          }
          return true; // Return success for reply handling
        } else {
          throw new Error(response.data.message || "Failed to add comment");
        }
      } catch (error) {
        console.error("Error adding comment:", error);
        alert(`Failed to add comment: ${error.response?.data?.message || error.message}`);
        return false;
      }
    }
    return false;
  };

  const handleLike = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("Please log in to like ideas");
        return;
      }

      const response = await axios.post(`http://localhost:5000/api/ideas/${ideaId}/like`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
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
            
            {idea.detailedDescription && (
              <div className="detailed-description">
                <h3>Detailed Description</h3>
                <p>{idea.detailedDescription}</p>
              </div>
            )}
            
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
              rows="4"
            />
            <button onClick={() => handleAddComment(null, newComment)} className="add-comment-button">
              Add Comment
            </button>
            
            <div className="comment-list">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <Comment 
                    key={comment._id} 
                    comment={comment} 
                    onAddReply={handleAddComment}
                    level={0}
                  />
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