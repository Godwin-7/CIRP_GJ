import React, { useEffect } from 'react';
import Swiper from 'swiper';
import 'swiper/css';
import 'swiper/css/pagination';
import './AboutUs.css';

const AboutUs = () => {
  useEffect(() => {
    // Initialize Swiper for responsive view
    new Swiper('.swiper-container', {
      slidesPerView: 1,
      spaceBetween: 10,
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      breakpoints: {
        640: {
          slidesPerView: 1,
        },
        768: {
          slidesPerView: 2,
        },
        1024: {
          slidesPerView: 3,
        },
      },
    });
  }, []);

  return (
    <section id="three">
      <section id="aboutUs">
      <h1 id="abt-us">About-us</h1>
      
      {/* Desktop view */}
      <div className="abt-wrapper">
        <img src="images/network.svg" alt="Pricing Image" />
        <div className="abt-content">
          <h3>Project Showcase and Collaboration :</h3>
          <p>
          Our platform allows innovators, researchers, and creators to showcase their projects or ideas in various fields. 
          Each project includes a detailed description, goals, and potential applications. Interested collaborators can directly connect with authors to discuss opportunities, offer expertise, or contribute resources....
          </p>
        </div>
      </div>
      
      <div className="abt-wrapper">
        <img src="images/teamwork.svg" alt="Commodities Image" />
        <div className="abt-content content-2">
          <h3>Expert Mentorship and Guidance :</h3>
          <p>
          Gain access to a diverse pool of experts from different industries who are ready to guide and mentor you through your project journey. 
          Our platform bridges the gap between idea creators and subject matter experts, ensuring that every idea gets the right direction and expertise to succeed....
          </p>
        </div>
      </div>
      
      <div className="abt-wrapper">
        <img src="images/analysis.svg" alt="Waste Image" />
        <div className="abt-content content-3">
          <h3>Idea Validation and Market Readiness :</h3>
          <p>
          Validate your ideas with real-time feedback from industry professionals and collaborators. 
          Our platform helps assess the feasibility, scalability, and market potential of your research or project, ensuring that your idea is ready for real-world application....
          </p>
        </div>
      </div>

      {/* Mobile responsive view with Swiper */}
      <div className="resp-abtus">
        <h2 id="abt-us">About-us</h2>
        <div className="swiper-container">
          <div className="swiper-wrapper">
            <div className="swiper-slide">
              <div className="abt-card">
                <div className="at-card-img">
                  <img src="images/pricing.svg" alt="Pricing Image" />
                </div>
                <div className="abt-card-heading">
                  <h3>Pricing</h3>
                </div>
                <div className="abt-card-text">
                  <p>
                    We offer standardized pricing in every city across all commodities.
                    Each commodity would have fixed price of it per unit. The price we fix keeps in mind your satisfaction.
                    You would be informed well in advance about prices.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="swiper-slide">
              <div className="abt-card" style={{ borderColor: "#FFC906" }}>
                <div className="at-card-img" style={{ backgroundColor: "#FFC906" }}>
                  <img src="images/cwa.svg" alt="Commodities Image" />
                </div>
                <div className="abt-card-heading">
                  <h3>Commodities we accept</h3>
                </div>
                <div className="abt-card-text">
                  <p>
                    Whether it be paper,plastic,steel or old iron we accept everything that's recyclable.
                    To be more specific we accept all paper items, all cardboard items,all metal items inculding tin,
                    and all plastic items that can be recycled.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="swiper-slide">
              <div className="abt-card" style={{ borderColor: "#2B77B5" }}>
                <div className="at-card-img" style={{ backgroundColor: "#2B77B5" }}>
                  <img src="images/wwdwyw.svg" alt="Waste Image" />
                </div>
                <div className="abt-card-heading">
                  <h3>What we do with your waste?</h3>
                </div>
                <div className="abt-card-text">
                  <p>
                    After collecting your waste we segregate it efficiently into dry and wet waste.
                    We then communicate and co-ordinate with all recyclable industries.
                    After that the segregated waste is sent to different plants specializing in that industry.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Pagination */}
          <div className="swiper-pagination"></div>
        </div>
      </div>
      </section>
    </section>
  );
};

export default AboutUs;