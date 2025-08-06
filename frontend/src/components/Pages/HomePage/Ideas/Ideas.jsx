import React, { useState, useEffect } from 'react';
import "./Ideas.css";
import { Link } from 'react-router-dom';
import axios from "axios";

const IdeaCard = ({ imageUrl, title, description, linkTo }) => {
  return (
    <Link to={linkTo} className="ideas-link no-underline">
      <div className="ideas-service-card">
        <div className="ideas-top-image">
          <img
            src={imageUrl}
            alt={title}
          />
        </div>
        <div className="ideas-card-content">
          <h2>{title}</h2>
          <p>{description}</p>
          <div className="ideas-click-button-wrapper">
            <p className="ideas-click-button">
              Click Here
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};

const Ideas = () => {
  const [domains, setDomains] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        // Fetch data from the new backend endpoint
        const response = await axios.get("http://localhost:5000/api/domains");
        setDomains(response.data);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching domains:", err);
        setError("Failed to load domains.");
        setIsLoading(false);
      }
    };
    fetchDomains();
  }, []);

  if (isLoading) {
    return <div className="ideas-loading">Loading ideas...</div>;
  }

  if (error) {
    return <div className="ideas-error">Error: {error}</div>;
  }

  return (
    <section id="ideas">
      <h1 id="ideas-main-title">Ideas</h1>
      <div className="ideas-container scrollbar-hide">
        {domains.map((domain) => (
          <IdeaCard
            key={domain._id}
            imageUrl={`http://localhost:5000${domain.imageurl}`}
            title={domain.title}
            description={domain.description}
            linkTo={`/domains/${domain._id}`}
          />
        ))}

        {/* This is the special card that links to all domains */}
        <Link to="/domains" className="ideas-link no-underline ideas-all-domains-card">
          <div className="ideas-service-card">
            <div className="ideas-card-content">
              <h2 className="ideas-all-domain-title">All Domains</h2>
              <p className="ideas-all-domain-description">Click to view all the available Domains</p>
              <div className="ideas-hover-domains">
                {domains.slice(0, 4).map((d) => (
                  <p key={d._id}>{d.title}</p>
                ))}
              </div>
              <div className="ideas-click-button-wrapper">
                <p className="ideas-click-button">Click Here</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
};

export default Ideas;