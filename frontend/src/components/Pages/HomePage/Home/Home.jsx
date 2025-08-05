import React, { useEffect, useState } from 'react';
import './Home.css';

const Home = () => {
  const [currentText, setCurrentText] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  const textArray = [
    "Collaborative",
    "Idea Research", 
    "Platform"
  ];
  
  const professions = [
    { icon: "💻", title: "Data Scientist", color: "#00d4ff" },
    { icon: "🌐", title: "Web Developer", color: "#ff6b6b" },
    { icon: "🎓", title: "ML Enthusiast", color: "#4ecdc4" },
    { icon: "🤖", title: "AI Engineer", color: "#45b7d1" },
    { icon: "📊", title: "Data Analyst", color: "#ffd93d" },
    { icon: "🔬", title: "Researcher", color: "#6c5ce7" }
  ];

  const angleStep = 360 / professions.length;

  useEffect(() => {
    // Load external CSS
    const loadCSS = (href, id) => {
      if (!document.getElementById(id)) {
        const link = document.createElement('link');
        link.href = href;
        link.rel = 'stylesheet';
        link.id = id;
        document.head.appendChild(link);
      }
    };
    
    loadCSS('https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css', 'boxicons-css');
    loadCSS('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap', 'poppins-font');
    
    // Anime.js style text animation cycle with fade out effect
    const animateText = () => {
      setIsVisible(false);
      
      setTimeout(() => {
        setCurrentText((prev) => (prev + 1) % textArray.length);
        
        setTimeout(() => {
          setIsVisible(true);
        }, 100);
      }, 600); // Fade out duration
    };
    
    const interval = setInterval(animateText, 2500);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="home-wrapper">
      <section id="home" className="home-section">
        <div className="home-container">
          <div className="home-row">
            <div className="home-content-left">
              <h3 className="home-greeting">Welcome to</h3>
              <div 
                className="home-animated-text"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.2) translateY(20px)',
                  transition: 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
              >
                {textArray[currentText]}
              </div>
              <p className="home-description">
                Aspiring Data Scientist & Machine Learning Enthusiast passionate about 
                creating innovative solutions through collaborative research and cutting-edge technology.
              </p>
              
              <a href="#contact" className="home-cta-button">
                Let's Collaborate
              </a>
            </div>
            
            <div className="home-content-right">
              <div className="home-profession-container">
                <div className="home-profession-circle">
                  {professions.map((profession, index) => {
                    const radius = window.innerWidth > 1000 ? 180 : 
                                  window.innerWidth > 768 ? 150 : 
                                  window.innerWidth > 480 ? 110 : 70;
                    return (
                      <div
                        key={index}
                        className="home-profession-item"
                        style={{
                          transform: `rotate(${index * angleStep}deg) translateX(${radius}px) rotate(-${index * angleStep}deg)`,
                          borderColor: profession.color,
                          background: `rgba(${
                            profession.color === '#00d4ff' ? '0, 212, 255' : 
                            profession.color === '#ff6b6b' ? '255, 107, 107' : 
                            profession.color === '#4ecdc4' ? '78, 220, 196' : 
                            profession.color === '#45b7d1' ? '69, 183, 209' :
                            profession.color === '#ffd93d' ? '255, 217, 61' :
                            '108, 92, 231'
                          }, 0.1)`
                        }}
                      >
                        <div className="home-profession-text">
                          <span 
                            className="home-profession-icon" 
                            style={{ color: profession.color }}
                          >
                            {profession.icon}
                          </span>
                          <div 
                            className="home-profession-title" 
                            style={{ color: profession.color }}
                          >
                            {profession.title}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <img 
                  src="/images/home-graphic.jpeg" 
                  alt="Profile" 
                  className="home-center-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;