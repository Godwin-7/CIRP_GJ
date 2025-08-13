import React, { useEffect } from 'react';
import Swiper from 'swiper';
import 'swiper/css';
import 'swiper/css/pagination';
import './AboutUs.css';

const AboutUs = () => {
  useEffect(() => {
    // Initialize Swiper for responsive view with proper timing and error handling
    const initSwiper = () => {
      const swiperElement = document.querySelector('.about-swiper-container');
      const swiperWrapper = document.querySelector('.swiper-wrapper');
      const swiperPagination = document.querySelector('.swiper-pagination');
      
      // Check if all required elements exist and are properly rendered
      if (swiperElement && swiperWrapper && swiperPagination && 
          swiperElement.offsetParent !== null) { // Ensure element is visible
        
        try {
          const swiper = new Swiper(swiperElement, {
            slidesPerView: 1,
            spaceBetween: 10,
            pagination: {
              el: '.about-swiper-pagination',
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

          // Store swiper instance for cleanup
          return swiper;
        } catch (error) {
          console.warn('Swiper initialization failed:', error);
          return null;
        }
      }
      return null;
    };

    // Try to initialize immediately
    let swiper = initSwiper();
    
    // If failed, try again after a short delay
    let timeoutId;
    if (!swiper) {
      timeoutId = setTimeout(() => {
        swiper = initSwiper();
      }, 100);
    }

    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (swiper && swiper.destroy) {
        swiper.destroy(true, true);
      }
    };
  }, []);

  return (
    <section id="about">
      <section id="aboutUs">
      <h1 id="about-us-title">About-us</h1>
      
      {/* Desktop view */}
      <div className="about-wrapper">
        <img src="images/network.svg" alt="Pricing Image" />
        <div className="about-content">
          <h3>Project Showcase and Collaboration :</h3>
          <p>
          Our platform allows innovators, researchers, and creators to showcase their projects or ideas in various fields. 
          Each project includes a detailed description, goals, and potential applications. Interested collaborators can directly connect with authors to discuss opportunities, offer expertise, or contribute resources....
          </p>
        </div>
      </div>
      
      <div className="about-wrapper">
        <img src="images/teamwork.svg" alt="Commodities Image" />
        <div className="about-content about-content-2">
          <h3>Expert Mentorship and Guidance :</h3>
          <p>
          Gain access to a diverse pool of experts from different industries who are ready to guide and mentor you through your project journey. 
          Our platform bridges the gap between idea creators and subject matter experts, ensuring that every idea gets the right direction and expertise to succeed....
          </p>
        </div>
      </div>
      
      <div className="about-wrapper">
        <img src="images/analysis.svg" alt="Waste Image" />
        <div className="about-content about-content-3">
          <h3>Idea Validation and Market Readiness :</h3>
          <p>
          Validate your ideas with real-time feedback from industry professionals and collaborators. 
          Our platform helps assess the feasibility, scalability, and market potential of your research or project, ensuring that your idea is ready for real-world application....
          </p>
        </div>
      </div>

      {/* Mobile responsive view with Swiper */}
      <div className="about-resp-abtus">
        <h2 id="about-us-mobile-title">About-us</h2>
        <div className="about-swiper-container">
          <div className="swiper-wrapper">
            <div className="swiper-slide">
              <div className="about-card">
                <div className="about-card-img">
                  <img src="images/pricing.svg" alt="Pricing Image" />
                </div>
                <div className="about-card-heading">
                  <h3>Pricing</h3>
                </div>
                <div className="about-card-text">
                  <p>
                    We offer standardized pricing in every city across all commodities.
                    Each commodity would have fixed price of it per unit. The price we fix keeps in mind your satisfaction.
                    You would be informed well in advance about prices.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="swiper-slide">
              <div className="about-card" style={{ borderColor: "#FFC906" }}>
                <div className="about-card-img" style={{ backgroundColor: "#FFC906" }}>
                  <img src="images/cwa.svg" alt="Commodities Image" />
                </div>
                <div className="about-card-heading">
                  <h3>Commodities we accept</h3>
                </div>
                <div className="about-card-text">
                  <p>
                    Whether it be paper,plastic,steel or old iron we accept everything that's recyclable.
                    To be more specific we accept all paper items, all cardboard items,all metal items inculding tin,
                    and all plastic items that can be recycled.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="swiper-slide">
              <div className="about-card" style={{ borderColor: "#2B77B5" }}>
                <div className="about-card-img" style={{ backgroundColor: "#2B77B5" }}>
                  <img src="images/wwdwyw.svg" alt="Waste Image" />
                </div>
                <div className="about-card-heading">
                  <h3>What we do with your waste?</h3>
                </div>
                <div className="about-card-text">
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