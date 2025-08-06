// DomainPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./DomainPage.css";

const DomainPage = () => {
  const navigate = useNavigate();
  // ✅ CORRECTED: State now tracks the selected difficulty level
  const [selectedLevel, setSelectedLevel] = useState(null); 
  const [Domains, setDomains] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const getdomain = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/domains");
      if (response.data) {
        setDomains(response.data);
      } else {
        setDomains([]);
      }
    } catch (err) {
      console.error("Error fetching domains:", err);
      setError("Failed to load domains.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDomainClick = (domainId) => {
    navigate(`/domains/${domainId}`);
  };

  const handleAddDomainClick = () => {
    navigate("/domainform");
  };

  // ✅ CORRECTED: A new function to handle the top-level difficulty filter buttons.
  const handleTopLevelClick = (level) => {
    // If the same button is clicked, unselect it. Otherwise, set the new level.
    setSelectedLevel(selectedLevel === level ? null : level);
  };

  useEffect(() => {
    getdomain();
  }, []);

  if (isLoading) {
    return <div className="domain-loading">Loading domains...</div>;
  }
  if (error) {
    return <div className="domain-error">Error: {error}</div>;
  }

  const renderDomainCards = () => {
    if (!Array.isArray(Domains) || Domains.length === 0) {
      return <p className="no-domains-message">No domains available at the moment.</p>;
    }
    
    // ✅ CORRECTED: Filter domains based on the selected difficulty level.
    const filteredDomains = selectedLevel 
      ? Domains.filter(domain => domain.topics && domain.topics[selectedLevel] && domain.topics[selectedLevel].length > 0)
      : Domains;

    return filteredDomains.map((domain) => (
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
            {/* ✅ CORRECTED: Displays topics based on the currently selected level. */}
            {selectedLevel && domain.topics && domain.topics[selectedLevel] && domain.topics[selectedLevel].map((topic, index) => (
                <p key={index}>{topic}</p>
              ))}
            {/* If no level is selected, display a mix of topics */}
            {!selectedLevel && (
              <>
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
          <div className="hover-levels">
            <button onClick={(e) => { e.stopPropagation(); handleDomainClick(domain._id); }}>View Topics</button>
          </div>
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