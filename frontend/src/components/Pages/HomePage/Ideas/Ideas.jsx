import React from 'react';
import "./Ideas.css";
import { Link } from 'react-router-dom';

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
  const ideasData = [
    {
      imageUrl: "/images/Elelctricity.jpeg",
      title: "Electricity Generation",
      description: "Click to know more about Piezoelectric Materials",
      linkTo: "#three"
    },
    {
      imageUrl: "/images/wwdwyw.svg",
      title: "Solar Energy",
      description: "Explore sustainable solar energy solutions",
      linkTo: "#four"
    },
    {
      imageUrl: "/images/cwa.svg",
      title: "Wind Power",
      description: "Learn about wind energy technologies",
      linkTo: "#five"
    },
    {
      imageUrl: "/images/map.svg",
      title: "Hydro Power",
      description: "Discover hydroelectric power generation",
      linkTo: "#six"
    },
    {
      imageUrl: "/images/biomass.svg",
      title: "Biomass Energy",
      description: "Learn about organic matter energy conversion",
      linkTo: "#seven"
    },
    {
        imageUrl: "", // No image for the special card
        title: "All Domains",
        description: "Click to view all the available Domains",
        linkTo: "/domains",
        isSpecial: true
    }
  ];

  return (
    <section id="ideas">
      <h1 id="ideas-main-title">Ideas</h1>
      <div className="ideas-container scrollbar-hide">
        {ideasData.map((idea, index) =>
          idea.isSpecial ? (
            <Link to="/domains" key={index} className="ideas-link no-underline ideas-all-domains-card">
              <div className="ideas-service-card">
                <div className="ideas-card-content">
                  <h2 className="ideas-all-domain-title">{idea.title}</h2>
                  <p className="ideas-all-domain-description">{idea.description}</p>
                  <div className="ideas-hover-domains">
                    <p>Water</p>
                    <p>Sun</p>
                    <p>Wind</p>
                    <p>Earth</p>
                  </div>
                  <div className="ideas-click-button-wrapper">
                    <p className="ideas-click-button">Click Here</p>
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <IdeaCard
              key={index}
              imageUrl={idea.imageUrl}
              title={idea.title}
              description={idea.description}
              linkTo={idea.linkTo}
            />
          )
        )}
      </div>
    </section>
  );
};

export default Ideas;