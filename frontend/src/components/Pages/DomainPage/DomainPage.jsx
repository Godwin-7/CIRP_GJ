import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./DomainPage.css";

const DomainPage = () => {
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState(null);
  // ✅ Initializing state as an empty array is a good practice.
  const [Domains, setDomains] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const getdomain = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/domains");
      // ✅ The backend might return null or an empty object, so we handle it here.
      if (response.data) {
        setDomains(response.data);
      } else {
        setDomains([]); // Ensure it's always an array
      }
    } catch (err) {
      console.error("Error fetching domains:", err);
      setError("Failed to load domains.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLevelClick = (domainId, level) => {
    // Check if Domains is an array before using find
    const domain = Array.isArray(Domains) ? Domains.find((d) => d._id === domainId) : null;
    if (domain) {
      navigate(`/domains/${domain.title.toLowerCase()}/${domainId}`);
    }
  };

  const handleDomainClick = (domainId) => {
    // Check if Domains is an array before using find
    const domain = Array.isArray(Domains) ? Domains.find((d) => d._id === domainId) : null;
    if (domain) {
      navigate(`/domains/${domain.title.toLowerCase()}/${domainId}`);
    }
  };

  const handleAddDomainClick = () => {
    navigate("/domainform");
  };

  useEffect(() => {
    getdomain();
  }, []);

  // Display loading or error messages
  if (isLoading) {
    return <div className="domain-loading">Loading domains...</div>;
  }
  if (error) {
    return <div className="domain-error">Error: {error}</div>;
  }

  // ✅ Add the conditional check before mapping
  const renderDomainCards = () => {
    if (!Array.isArray(Domains) || Domains.length === 0) {
      return <p className="no-domains-message">No domains available at the moment.</p>;
    }
    
    return Domains.map((domain) => (
      <div
        key={domain._id}
        className="domain-card"
        onClick={() => handleDomainClick(domain._id)}
      >
        <div className="top-image">
          <img
            src={`http://localhost:5000${domain.imageurl}`}
            alt={domain.title}
          />
        </div>
        <h2 className="domain-title">{domain.title}</h2>
        <p className="domain-description">{domain.description}</p>
        
        <div className="hover-content">
          <h2 className="hover-domain-title">{domain.title}</h2>
          <div className="hover-topics">
            {selectedLevel ? (
              // ✅ Add conditional check for domain.topics and the selected level
              domain.topics && domain.topics[selectedLevel] && domain.topics[selectedLevel].map((topic, index) => (
                <p key={index}>{topic}</p>
              ))
            ) : (
              <>
                {/* ✅ Add conditional checks for all topic levels */}
                {domain.topics && domain.topics.easy && domain.topics.easy.slice(0, 2).map((topic, index) => (
                  <p key={`easy-${index}`}>{topic}</p>
                ))}
                {domain.topics && domain.topics.medium && domain.topics.medium.slice(0, 2).map((topic, index) => (
                  <p key={`medium-${index}`}>{topic}</p>
                ))}
                {domain.topics && domain.topics.hard && domain.topics.hard.slice(0, 2).map((topic, index) => (
                  <p key={`hard-${index}`}>{topic}</p>
                ))}
              </>
            )}
          </div>
          {!selectedLevel && (
            <div className="hover-levels">
              <button onClick={(e) => { e.stopPropagation(); handleLevelClick(domain._id, "easy"); }}>Easy</button>
              <button onClick={(e) => { e.stopPropagation(); handleLevelClick(domain._id, "medium"); }}>Medium</button>
              <button onClick={(e) => { e.stopPropagation(); handleLevelClick(domain._id, "hard"); }}>Hard</button>
            </div>
          )}
        </div>
        <button className="click-button">Click Here</button>
      </div>
    ));
  };

  return (
    <div className="domain-page">
      <h1 className="domain-page-title">All Domains</h1>
      <div className="level-filters">
        <button
          className={`level-filter ${selectedLevel === "easy" ? "active" : ""}`}
          onClick={() => handleTopLevelClick("easy")}
        >
          Easy
        </button>
        <button
          className={`level-filter ${selectedLevel === "medium" ? "active" : ""}`}
          onClick={() => handleTopLevelClick("medium")}
        >
          Medium
        </button>
        <button
          className={`level-filter ${selectedLevel === "hard" ? "active" : ""}`}
          onClick={() => handleTopLevelClick("hard")}
        >
          Hard
        </button>
      </div>
      <div className="domains-container">
        {renderDomainCards()}
        <div
          className="domain-card add-domain-card"
          onClick={handleAddDomainClick}
        >
          <h2 className="domain-title">Add New Domain</h2>
          <p className="domain-description">Click here to add a new domain</p>
          <button className="click-button">Add Domain</button>
        </div>
      </div>
    </div>
  );
};

export default DomainPage;