  import { useParams } from "react-router-dom";
  import { useEffect, useState } from "react";
  import { useNavigate } from "react-router-dom";
  import axios from "axios"; // Added axios import
  import "./TitlePage.css"; // Import the CSS file
  import Chat from "../ChatPage/Chat";

  const TitlePage = () => {
    const { domainId } = useParams();
    const [domain, setDomain] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleProject = (ideaId) => {
      navigate(`/domains/${domainId}/ideas/${ideaId}`);
    };

    const handleAddIdea = () => {
      navigate("/addidea");
    };

    useEffect(() => {
      const fetchDomainData = async () => {
        try {
          // ✅ Updated fetch URL using axios
          console.log('Fetching domain with ID:', domainId); // Add this
      const res = await axios.get(`http://localhost:5000/api/domains/${domainId}`);
      console.log('Domain response:', res.data); // Add this
      console.log('Ideas in domain:', res.data.ideas); // Add this
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

      fetchDomainData();
    }, [domainId]);

    if (isLoading) {
      return (
        <div className="title-page">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading domain details...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="title-page">
          <div className="error-message">Error: {error}</div>
        </div>
      );
    }

    if (!domain) return null;

    return (
      <div className="title-page">
        <div className="domain-header">
          <div className="domain-image-container">
            {domain.imageurl ? (
              <img
                src={`http://localhost:5000${domain.imageurl}`}
                alt={domain.title}
                className="domain-image"
              />
            ) : (
              <div className="domain-placeholder"></div>
            )}
            <div className="domain-overlay">
              <h1 className="domain-title">{domain.title}</h1>
            </div>
          </div>
          <p className="domain-description">{domain.description}</p>
        </div>

        <div className="topics-container">
          {domain.ideas && domain.ideas.length > 0 ? (
            domain.ideas.map((idea) => (
              <div
                key={idea._id}
                className="topic-card"
                onClick={() => handleProject(idea._id)}
              >
                {/* Displaying idea title from the new backend data */}
                <h2 className="topic-title">{idea.title}</h2> 
                <p className="topic-description">{idea.description}</p>
              </div>
            ))
          ) : (
            <p className="no-topics">No ideas available for this domain yet.</p>
          )}
        </div>

        {/* New Box to Navigate to /addidea */}
        <div className="add-idea-card" onClick={handleAddIdea}>
          <h2 className="add-idea-title">Have an Idea?</h2>
          <p>Click here to share your innovative concept!</p>
          <button className="add-idea-button">Add Your Idea</button>
        </div>

        <div className="">
          <Chat />
        </div>
      </div>
    );
  };

  export default TitlePage;