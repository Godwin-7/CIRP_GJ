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
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  // Check authentication and get user ID
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.userId);
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
  }, []);

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
        setNewStatus(ideaData.status || "Not yet started");
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

  const handleStatusUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("Please log in to update status");
        return;
      }

      const response = await axios.put(
        `http://localhost:5000/api/ideas/${ideaId}`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setIdea(prevIdea => ({
          ...prevIdea,
          status: newStatus
        }));
        setIsEditingStatus(false);
        alert("Status updated successfully!");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status. " + (error.response?.data?.message || error.message));
    }
  };

  const canEditStatus = () => {
    return currentUserId && idea && (
      idea.createdBy?._id === currentUserId || 
      idea.createdBy === currentUserId
    );
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
          {/* Basic Project Information */}
          <div className="content-box">
            <h2>📄 Project Details</h2>
            <p><strong>Description:</strong> {idea.description}</p>
            
            {idea.detailedDescription && (
              <div className="detailed-description">
                <h3>Detailed Description</h3>
                <p>{idea.detailedDescription}</p>
              </div>
            )}
          </div>

          {/* Project Images */}
          {idea.projectImage && (
            <div className="content-box">
              <h2>🖼️ Project Images</h2>
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
            </div>
          )}
          
          {idea.additionalImages && idea.additionalImages.length > 0 && (
            <div className="content-box">
              <h2>📷 Additional Images</h2>
              <div className="project-images">
                {idea.additionalImages.map((imageObj, index) => (
                  <div key={index} className="additional-image">
                    <img 
                      src={`http://localhost:5000${imageObj.url || imageObj}`} 
                      alt={imageObj.caption || `Project image ${index + 1}`} 
                      onError={(e) => {
                        console.error('Additional image failed to load:', e.target.src);
                        e.target.style.display = 'none';
                      }}
                    />
                    {imageObj.caption && <p className="image-caption">{imageObj.caption}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Project Metadata */}
          <div className="content-box">
            <h2>ℹ️ Project Information</h2>
            <div className="project-info-grid">
              <p><strong>📅 Created:</strong> {new Date(idea.createdAt).toLocaleDateString()}</p>
              <p><strong>🎯 Difficulty:</strong> 
                <span className={`difficulty-badge ${idea.difficulty?.toLowerCase()}`}>
                  {idea.difficulty}
                </span>
              </p>
              <p><strong>📂 Category:</strong> {idea.category}</p>
              
              {/* Enhanced Status Section */}
              <div className="project-status-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <p><strong>📈 Status:</strong></p>
                  {!isEditingStatus ? (
                    <>
                      <span className={`status-badge ${idea.status?.toLowerCase().replace(/\s+/g, '-') || 'not-started'}`}>
                        {idea.status || "Not yet started"}
                      </span>
                      {canEditStatus() && (
                        <button 
                          onClick={() => setIsEditingStatus(true)}
                          className="edit-status-btn"
                        >
                          Edit
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="status-edit-controls">
                      <select 
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                      >
                        <option value="Not yet started">Not yet started</option>
                        <option value="In progress">In progress</option>
                        <option value="Collaboration needed">Collaboration needed</option>
                        <option value="Completed">Completed</option>
                        <option value="On hold">On hold</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      <button onClick={handleStatusUpdate} className="save-btn">Save</button>
                      <button 
                        onClick={() => {
                          setIsEditingStatus(false);
                          setNewStatus(idea.status || "Not yet started");
                        }}
                        className="cancel-btn"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Estimated Duration */}
              {idea.estimatedDuration && (
                <p><strong>⏱️ Estimated Duration:</strong> 
                  {idea.estimatedDuration.value} {idea.estimatedDuration.unit}
                </p>
              )}
            </div>
          </div>

          {/* Tags and Skills */}
          {(idea.tags && idea.tags.length > 0) && (
            <div className="content-box">
              <h2>🏷️ Tags</h2>
              <div className="tags-container">
                {idea.tags.map((tag, index) => (
                  <span key={index} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          )}
          
          {(idea.requiredSkills && idea.requiredSkills.length > 0) && (
            <div className="content-box">
              <h2>🛠️ Required Skills</h2>
              <div className="skills-container">
                {idea.requiredSkills.map((skillObj, index) => (
                  <span key={index} className="skill">
                    {typeof skillObj === 'object' ? `${skillObj.skill} (${skillObj.level || 'intermediate'})` : skillObj}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Project Scope */}
          {idea.scope && (
            <div className="content-box">
              <h2>🎯 Project Scope</h2>
              <div className="scope-section">
                {idea.scope.shortTerm && idea.scope.shortTerm.length > 0 && (
                  <div className="scope-item">
                    <h3>Short-term Goals</h3>
                    <ul>
                      {idea.scope.shortTerm.map((goal, index) => (
                        <li key={index}>{goal}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {idea.scope.longTerm && idea.scope.longTerm.length > 0 && (
                  <div className="scope-item">
                    <h3>Long-term Goals</h3>
                    <ul>
                      {idea.scope.longTerm.map((goal, index) => (
                        <li key={index}>{goal}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {idea.scope.limitations && idea.scope.limitations.length > 0 && (
                  <div className="scope-item">
                    <h3>Limitations</h3>
                    <ul>
                      {idea.scope.limitations.map((limitation, index) => (
                        <li key={index}>{limitation}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {idea.scope.assumptions && idea.scope.assumptions.length > 0 && (
                  <div className="scope-item">
                    <h3>Assumptions</h3>
                    <ul>
                      {idea.scope.assumptions.map((assumption, index) => (
                        <li key={index}>{assumption}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Future Enhancements */}
          {idea.futureEnhancements && idea.futureEnhancements.length > 0 && (
            <div className="content-box">
              <h2>🚀 Future Enhancements</h2>
              <div className="enhancements-list">
                {idea.futureEnhancements.map((enhancement, index) => (
                  <div key={index} className="enhancement-item">
                    <div className="enhancement-header">
                      <h3>{enhancement.title}</h3>
                      <span className={`priority-badge ${enhancement.priority.toLowerCase()}`}>
                        {enhancement.priority} priority
                      </span>
                    </div>
                    <p>{enhancement.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Related Links */}
          {idea.relatedLinks && idea.relatedLinks.length > 0 && (
            <div className="content-box">
              <h2>🔗 Related Links</h2>
              <div className="related-links">
                {idea.relatedLinks.map((linkObj, index) => (
                  <div key={index} className="link-item">
                    <div className="link-header">
                      <a href={linkObj.url || linkObj} target="_blank" rel="noopener noreferrer">
                        {linkObj.title || linkObj.url || linkObj}
                      </a>
                      <span className={`link-type ${linkObj.type || 'other'}`}>
                        {linkObj.type || 'other'}
                      </span>
                    </div>
                    {linkObj.description && <p className="link-description">{linkObj.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Project Documents */}
          {idea.projectPdf && (
            <div className="content-box">
              <h2>📄 Project Documents</h2>
              <div className="pdf-container">
                <div className="document-item">
                  <div className="document-icon">📄</div>
                  <div className="document-info">
                    <a 
                      href={`http://localhost:5000${idea.projectPdf.path || idea.projectPdf}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="pdf-link"
                    >
                      {idea.projectPdf.originalName || "Project Document"}
                    </a>
                    {idea.projectPdf.size && (
                      <span className="file-size">
                        ({(idea.projectPdf.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Collaboration Section */}
          <div className="content-box">
            <h2>❤️ Engagement & Collaboration</h2>
            <div className="engagement-stats">
              <div className="stat-item">
                <span className="stat-number">{idea.stats?.totalLikes || idea.likeCount || 0}</span>
                <span className="stat-label">Likes</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{idea.collaborationInterests?.length || 0}</span>
                <span className="stat-label">Collaboration Interests</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{idea.stats?.totalViews || 0}</span>
                <span className="stat-label">Views</span>
              </div>
            </div>
            <button onClick={handleLike} className="like-button">
              👍 I'm Interested in This Project!
            </button>
          </div>

          {/* Comments Section */}
          <div className="content-box">
            <h2>💬 Comments & Discussion</h2>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts, suggestions, or questions about this project..."
              className="comment-input"
              rows="4"
            />
            <button onClick={() => handleAddComment(null, newComment)} className="add-comment-button">
              Post Comment
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
                <p className="no-comments">No comments yet. Be the first to share your thoughts!</p>
              )}
            </div>
          </div>
        </div>

        {/* Author Information Sidebar */}
        <aside className="author-box">
          <h2>👤 Project Author</h2>
          {idea.author && (
            <div className="author-info">
              <div className="author-avatar">
                <img 
                  src={
                    idea.author.profileImage 
                      ? `http://localhost:5000${idea.author.profileImage}` 
                      : "/img/author_default.jpg"
                  } 
                  alt={idea.author.authorName}
                  onError={(e) => {
                    e.target.src = "/img/author_default.jpg";
                  }}
                />
              </div>
              
              <div className="author-details">
                <h3>{idea.author.authorName}</h3>
                
                {/* Contact Information */}
                <div className="contact-info">
                  <div className="contact-item">
                    <span className="contact-label">📧 Email:</span>
                    <a href={`mailto:${idea.author.authorEmail || idea.author.contactInfo?.email}`}>
                      {idea.author.authorEmail || idea.author.contactInfo?.email || 'Not available'}
                    </a>
                  </div>
                  
                  <div className="contact-item">
                    <span className="contact-label">📱 Phone:</span>
                    <span>
                      {idea.author.phone || idea.author.contactInfo?.phone || 'Not provided'}
                    </span>
                  </div>
                </div>
                
                {/* Professional Information */}
                {(idea.author.title || idea.author.organization) && (
                  <div className="professional-info">
                    {idea.author.title && (
                      <p><strong>Title:</strong> {idea.author.title}</p>
                    )}
                    {idea.author.organization && (
                      <p><strong>Organization:</strong> {idea.author.organization}</p>
                    )}
                    {idea.author.department && (
                      <p><strong>Department:</strong> {idea.author.department}</p>
                    )}
                  </div>
                )}
                
                {/* Bio */}
                <div className="author-bio">
                  <h4>About the Author</h4>
                  <p>{idea.author.bio || "No bio available."}</p>
                </div>
                
                {/* Social Media Links */}
                {idea.author.socialMedia && idea.author.socialMedia.length > 0 && (
                  <div className="author-social">
                    <h4>Connect with Author</h4>
                    {idea.author.socialMedia.map((social, index) => (
                      <div key={index} className="social-link">
                        <a 
                          href={social.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="social-media-link"
                        >
                          {social.platform.charAt(0).toUpperCase() + social.platform.slice(1)}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Research Areas */}
                {idea.author.researchAreas && idea.author.researchAreas.length > 0 && (
                  <div className="research-areas">
                    <h4>Research Areas</h4>
                    <div className="research-tags">
                      {idea.author.researchAreas.map((area, index) => (
                        <span key={index} className="research-tag">{area}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Expertise */}
                {idea.author.expertise && idea.author.expertise.length > 0 && (
                  <div className="expertise-section">
                    <h4>Expertise</h4>
                    <div className="expertise-list">
                      {idea.author.expertise.map((skill, index) => (
                        <div key={index} className="expertise-item">
                          <span className="skill-name">{skill.skill}</span>
                          {skill.level && <span className="skill-level">({skill.level})</span>}
                          {skill.yearsOfExperience && (
                            <span className="skill-years">{skill.yearsOfExperience}+ years</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
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