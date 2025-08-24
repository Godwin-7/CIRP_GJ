import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./TitlePage.css";
import Chat from "../ChatPage/Chat";

const TitlePage = () => {
  const { domainId } = useParams();
  const [domain, setDomain] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  const handleProject = (ideaId) => {
    navigate(`/domains/${domainId}/ideas/${ideaId}`);
  };

  const handleAddIdea = () => {
    navigate("/addidea");
  };

  const handleEditDomain = () => {
    // Navigate to domain edit form
    navigate(`/domainform?edit=${domainId}`);
  };

  const handleDeleteDomain = async () => {
    if (!window.confirm(`Are you sure you want to delete the domain "${domain.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to delete a domain');
        navigate('/login');
        return;
      }

      // Check if user is admin for different delete behavior
      if (domain.isAdmin) {
        // Admin can force delete
        const forceDelete = window.confirm(
          `As an admin, you can permanently delete this domain and all its ideas. Do you want to proceed?`
        );
        
        if (forceDelete) {
          await axios.delete(`http://localhost:5000/api/admin/domains/${domainId}?force=true`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          alert('Domain and all associated ideas have been permanently deleted');
        }
      } else {
        // Regular user delete (soft delete)
        await axios.delete(`http://localhost:5000/api/domains/${domainId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Domain has been archived successfully');
      }
      
      navigate('/domains');
    } catch (error) {
      console.error('Failed to delete domain:', error);
      if (error.response?.status === 400 && error.response?.data?.data?.activeIdeasCount) {
        const { activeIdeasCount } = error.response.data.data;
        alert(`Cannot delete domain: it contains ${activeIdeasCount} active ideas. Contact an admin for permanent deletion.`);
      } else {
        alert('Failed to delete domain: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleDeleteIdea = async (ideaId, ideaTitle) => {
    if (!window.confirm(`Are you sure you want to delete the idea "${ideaTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to delete an idea');
        navigate('/login');
        return;
      }

      let deleteUrl = `http://localhost:5000/api/ideas/${ideaId}`;
      
      // If user is admin, use admin delete route for permanent deletion
      if (currentUser?.isAdmin) {
        deleteUrl = `http://localhost:5000/api/admin/ideas/${ideaId}`;
      }

      await axios.delete(deleteUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(currentUser?.isAdmin ? 'Idea permanently deleted' : 'Idea deleted successfully');
      
      // Refresh domain data
      fetchDomainData();
    } catch (error) {
      console.error('Failed to delete idea:', error);
      alert('Failed to delete idea: ' + (error.response?.data?.message || error.message));
    }
  };

  const checkUserStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get('http://localhost:5000/api/auth/verify', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentUser(response.data.data.user);
      }
    } catch (error) {
      console.error('Failed to verify user:', error);
      // Clear invalid token
      localStorage.removeItem('token');
    }
  };

  const fetchDomainData = async () => {
    try {
      console.log('Fetching domain with ID:', domainId);
      
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const res = await axios.get(`http://localhost:5000/api/domains/${domainId}`, config);
      console.log('Domain response:', res.data);
      console.log('Ideas in domain:', res.data.ideas);
      
      if (res.status !== 200) {
        throw new Error("Failed to fetch domain data");
      }
      setDomain(res.data);
    } catch (err) {
      console.error("Error fetching domain:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkUserStatus();
  }, []);

  useEffect(() => {
    if (domainId) {
      fetchDomainData();
    }
  }, [domainId, currentUser]);

  if (isLoading) {
    return (
      <div id="title-page">
        <div className="title-page-loading-container">
          <div className="title-page-spinner"></div>
          <p>Loading domain details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div id="title-page">
        <div className="title-page-error-message">Error: {error}</div>
      </div>
    );
  }

  if (!domain) return null;

  return (
    <div id="title-page">
      <div className="title-page-domain-header">
        <div className="title-page-domain-image-container">
          {domain.imageurl || domain.imageUrl ? (
            <img
              src={`http://localhost:5000${domain.imageurl || domain.imageUrl}`}
              alt={domain.title}
              className="title-page-domain-image"
              onError={(e) => {
                console.error('Domain image failed to load:', e.target.src);
                e.target.src = '/uploads/defaults/default-domain.jpg';
              }}
            />
          ) : (
            <div className="title-page-domain-placeholder"></div>
          )}
          <div className="title-page-domain-overlay">
            <h1 className="title-page-domain-title">{domain.title}</h1>
          </div>
        </div>
        
        <div className="title-page-domain-content">
          <p className="title-page-domain-description">{domain.description}</p>
          {domain.detailedDescription && (
            <div className="title-page-domain-detailed-description">
              <p>{domain.detailedDescription}</p>
            </div>
          )}

          {/* Admin/Owner Actions */}
          {(domain.canEdit || domain.canDelete) && (
            <div className="title-page-domain-actions">
              <h3>Domain Management</h3>
              <div className="title-page-action-buttons">
                {domain.canEdit && (
                  <button onClick={handleEditDomain} className="title-page-edit-btn">
                    Edit Domain
                  </button>
                )}
                {domain.canDelete && (
                  <button onClick={handleDeleteDomain} className="title-page-delete-btn">
                    {domain.isAdmin ? 'Delete Domain (Admin)' : 'Archive Domain'}
                  </button>
                )}
                {domain.isAdmin && (
                  <button 
                    onClick={() => navigate('/admin')} 
                    className="title-page-admin-panel-btn"
                  >
                    Admin Dashboard
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="title-page-topics-container">
        {domain.ideas && domain.ideas.length > 0 ? (
          domain.ideas.map((idea) => (
            <div
              key={idea._id}
              className="title-page-topic-card flip-in"
            >
              <div className="title-page-idea-content" onClick={() => handleProject(idea._id)}>
                <h2 className="title-page-topic-title">{idea.title}</h2>
                <p className="title-page-topic-description">{idea.description}</p>
                {idea.difficulty && (
                  <span className={`title-page-difficulty-badge ${idea.difficulty}`}>
                    {idea.difficulty.toUpperCase()}
                  </span>
                )}
                {idea.tags && idea.tags.length > 0 && (
                  <div className="title-page-idea-tags">
                    {idea.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="title-page-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Idea Management Actions */}
              {(idea.canEdit || idea.canDelete || currentUser?.isAdmin) && (
                <div className="title-page-idea-actions">
                  {idea.canDelete && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteIdea(idea._id, idea.title);
                      }}
                      className="title-page-delete-idea-btn"
                      title={currentUser?.isAdmin ? "Permanently delete idea (Admin)" : "Delete idea"}
                    >
                      {currentUser?.isAdmin ? '🗑️ Admin Delete' : '🗑️ Delete'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="title-page-no-topics">No ideas available for this domain yet.</p>
        )}
      </div>

      {/* Add Idea Card */}
      <div className="title-page-add-idea-card" onClick={handleAddIdea}>
        <h2 className="title-page-add-idea-title">Have an Idea?</h2>
        <p>Click here to share your innovative concept for this domain!</p>
        <button className="title-page-add-idea-button">Add Your Idea</button>
      </div>

      {/* Domain Chat Section */}
      <div className="title-page-chat-section">
        <Chat domainId={domainId} />
      </div>
    </div>
  );
};

export default TitlePage;