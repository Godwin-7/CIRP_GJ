import React, { useEffect, useState } from 'react';

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
    <div style={{
      fontFamily: "'Poppins', sans-serif",
      margin: 0,
      padding: 0,
      boxSizing: 'border-box'
    }}>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        .home-section {
          min-height: 100vh;
          background: linear-gradient(135deg, #0b061f 0%, #1a0033 50%, #2d1b69 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          position: relative;
          overflow: hidden;
          padding: clamp(1rem, 3vw, 4rem) clamp(0.5rem, 2vw, 2rem);
        }
        
        .home-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 20% 50%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, rgba(255, 107, 107, 0.1) 0%, transparent 50%);
          pointer-events: none;
        }
        
        .home-container {
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
          position: relative;
          z-index: 2;
        }
        
        .home-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          min-height: clamp(400px, 80vh, 600px);
          gap: clamp(1rem, 4vw, 4rem);
          flex-wrap: nowrap;
        }
        
        .home-content-left {
          flex: 1 1 40%;
          min-width: 300px;
          max-width: 500px;
          animation: slideInLeft 1s ease-out;
        }
        
        .home-greeting {
          font-size: clamp(1.2rem, 3.5vw, 2rem);
          font-weight: 300;
          color: #00d4ff;
          margin-bottom: clamp(0.5rem, 1.5vw, 1rem);
          opacity: 0;
          animation: fadeInUp 1s ease-out 0.2s forwards;
        }
        
        .home-animated-text {
          font-size: clamp(1.8rem, 5vw, 3.5rem);
          font-weight: 700;
          color: #00d4ff;
          margin-bottom: clamp(1.5rem, 3vw, 2rem);
          min-height: clamp(2rem, 6vw, 4rem);
          display: flex;
          align-items: center;
          opacity: ${isVisible ? 1 : 0};
          transform: ${isVisible ? 'scale(1) translateY(0)' : 'scale(0.2) translateY(20px)'};
          transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        .home-description {
          font-size: clamp(0.9rem, 2vw, 1.2rem);
          line-height: 1.6;
          color: #cccccc;
          margin-bottom: clamp(1.5rem, 3vw, 2rem);
          opacity: 0;
          animation: fadeInUp 1s ease-out 0.6s forwards;
        }
        
        .home-cta-button {
          display: inline-block;
          padding: clamp(0.8rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2.5rem);
          background: linear-gradient(45deg, #00d4ff, #ff6b6b);
          color: white;
          text-decoration: none;
          border-radius: 50px;
          font-weight: 600;
          font-size: clamp(0.9rem, 2vw, 1.1rem);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          opacity: 0;
          animation: fadeInUp 1s ease-out 1s forwards;
          box-shadow: 0 4px 15px rgba(0, 212, 255, 0.2);
        }
        
        .home-cta-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }
        
        .home-cta-button:hover::before {
          left: 100%;
        }
        
        .home-cta-button:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 8px 25px rgba(0, 212, 255, 0.4);
        }
        
        .home-content-right {
          flex: 1 1 60%;
          min-width: 350px;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          animation: slideInRight 1s ease-out;
        }
        
        .home-profession-container {
          position: relative;
          width: 100%;
          height: auto;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .home-profession-circle {
          position: relative;
          width: clamp(350px, 40vw, 550px);
          height: clamp(350px, 40vw, 550px);
          border: 3px solid #00d4ff;
          border-radius: 50%;
          animation: rotate 20s linear infinite;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .home-profession-item {
          position: absolute;
          background: rgba(0, 212, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 212, 255, 0.3);
          border-radius: 15px;
          padding: clamp(0.6rem, 1.2vw, 1.2rem);
          min-width: clamp(90px, 12vw, 130px);
          max-width: clamp(100px, 14vw, 150px);
          text-align: center;
          transition: all 0.3s ease;
          cursor: pointer;
          z-index: 5;
          transform-origin: center;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
        
        .home-profession-text {
          animation: counter-rotate 20s linear infinite;
          transition: all 0.3s ease;
        }
        
        .home-profession-item:hover {
          background: rgba(0, 212, 255, 0.25);
          z-index: 10;
          min-width: auto;
          max-width: none;
          width: auto;
          white-space: nowrap;
        }
        
        .home-profession-item:hover .home-profession-text {
          animation-play-state: paused;
        }
        
        .home-profession-item:hover .home-profession-title {
          white-space: nowrap;
          overflow: visible;
          text-overflow: unset;
          max-width: none;
        }
        
        .home-profession-icon {
          font-size: clamp(1.5rem, 2.5vw, 2.8rem);
          margin-bottom: 0.5rem;
          display: block;
          transition: all 0.3s ease;
        }
        
        .home-profession-item:hover .home-profession-icon {
          transform: scale(1.2) translateY(-5px);
        }
        
        .home-profession-title {
          font-size: clamp(0.7rem, 1.4vw, 1.1rem);
          font-weight: 600;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: clamp(90px, 12vw, 130px);
          transition: all 0.3s ease;
        }
        
        .home-center-image {
          width: clamp(150px, 18vw, 220px);
          height: clamp(150px, 18vw, 220px);
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #00d4ff;
          box-shadow: 0 0 30px rgba(0, 212, 255, 0.3);
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 15;
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes counter-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Responsive Design */
        @media (max-width: 1400px) {
          .home-profession-circle {
            width: clamp(320px, 38vw, 480px);
            height: clamp(320px, 38vw, 480px);
          }
          
          .home-profession-item {
            min-width: clamp(85px, 11vw, 110px);
            max-width: clamp(95px, 13vw, 130px);
          }
          
          .home-center-image {
            width: clamp(140px, 16vw, 200px);
            height: clamp(140px, 16vw, 200px);
          }
        }
        
        @media (max-width: 1200px) {
          .home-row {
            gap: clamp(1rem, 3vw, 2rem);
          }
          
          .home-profession-circle {
            width: clamp(300px, 36vw, 420px);
            height: clamp(300px, 36vw, 420px);
          }
          
          .home-profession-item {
            min-width: clamp(80px, 10vw, 100px);
            max-width: clamp(90px, 12vw, 120px);
          }
          
          .home-center-image {
            width: clamp(130px, 15vw, 180px);
            height: clamp(130px, 15vw, 180px);
          }
        }
        
        @media (max-width: 1000px) {
          .home-section {
            padding: clamp(1rem, 2vw, 3rem) clamp(0.5rem, 1.5vw, 1.5rem);
          }
          
          .home-row {
            gap: clamp(1.5rem, 4vw, 2rem);
          }
          
          .home-content-left {
            flex: 1 1 45%;
            min-width: 250px;
          }
          
          .home-content-right {
            flex: 1 1 55%;
            min-width: 280px;
          }
          
          .home-profession-circle {
            width: clamp(280px, 34vw, 380px);
            height: clamp(280px, 34vw, 380px);
          }
          
          .home-profession-item {
            min-width: clamp(75px, 9vw, 90px);
            max-width: clamp(85px, 11vw, 110px);
            padding: clamp(0.5rem, 1vw, 1rem);
          }
          
          .home-center-image {
            width: clamp(120px, 14vw, 160px);
            height: clamp(120px, 14vw, 160px);
          }
        }
        
        /* Tablet Responsive Design (Keep side by side) */
        @media (max-width: 768px) {
          .home-section {
            padding: clamp(1rem, 2vw, 2rem) clamp(0.5rem, 1.5vw, 1rem);
          }
          
          .home-row {
            min-height: 50vh;
            gap: clamp(1rem, 2vw, 1.5rem);
          }
          
          .home-content-left {
            flex: 1 1 45%;
            min-width: 200px;
          }
          
          .home-content-right {
            flex: 1 1 55%;
            min-width: 220px;
          }
          
          .home-profession-circle {
            width: clamp(250px, 38vw, 320px);
            height: clamp(250px, 38vw, 320px);
          }
          
          .home-profession-item {
            min-width: clamp(60px, 10vw, 80px);
            max-width: clamp(70px, 12vw, 90px);
            padding: clamp(0.4rem, 1vw, 0.8rem);
          }
          
          .home-profession-title {
            max-width: clamp(60px, 10vw, 80px);
          }
          
          .home-center-image {
            width: clamp(100px, 16vw, 140px);
            height: clamp(100px, 16vw, 140px);
          }
        }
        
        /* Mobile Responsive Design (Keep side by side) */
        @media (max-width: 480px) {
          .home-section {
            padding: 1rem 0.5rem;
          }
          
          .home-row {
            gap: 1rem;
            min-height: 40vh;
          }

          .home-content-left {
            flex: 1 1 50%;
            min-width: 150px;
          }

          .home-content-right {
            flex: 1 1 50%;
            min-width: 180px;
          }
          
          .home-profession-circle {
            width: clamp(180px, 48vw, 250px);
            height: clamp(180px, 48vw, 250px);
          }
          
          .home-profession-item {
            min-width: clamp(45px, 8vw, 60px);
            max-width: clamp(55px, 10vw, 70px);
            padding: 0.3rem;
          }
          
          .home-profession-icon {
            font-size: clamp(1rem, 3vw, 1.5rem);
            margin-bottom: 0.2rem;
          }
          
          .home-profession-title {
            font-size: clamp(0.5rem, 2vw, 0.7rem);
            max-width: clamp(45px, 8vw, 60px);
          }
          
          .home-center-image {
            width: clamp(80px, 18vw, 110px);
            height: clamp(80px, 18vw, 110px);
          }
        }
        
        /* Extra Small Mobile Design (Keep side by side) */
        @media (max-width: 320px) {
          .home-section {
            padding: 0.75rem 0.25rem;
          }

          .home-content-left {
            min-width: 120px;
          }

          .home-content-right {
            min-width: 150px;
          }
          
          .home-profession-circle {
            width: 150px;
            height: 150px;
          }
          
          .home-profession-item {
            min-width: 40px;
            max-width: 50px;
            padding: 0.2rem;
          }
          
          .home-profession-icon {
            font-size: 0.8rem;
          }
          
          .home-profession-title {
            font-size: 0.4rem;
            max-width: 40px;
          }
          
          .home-center-image {
            width: 60px;
            height: 60px;
          }
        }
        
        /* Prevent layout shift on very small screens */
        @media (max-width: 280px) {
          .home-content-left, .home-content-right {
            min-width: unset;
            width: 50%;
          }
        }
      `}</style>
      
      <section className="home-section">
        <div className="home-container">
          <div className="home-row">
            <div className="home-content-left">
              <h3 className="home-greeting">Welcome to</h3>
              <div className="home-animated-text">
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
                          <span className="home-profession-icon" style={{ color: profession.color }}>
                            {profession.icon}
                          </span>
                          <div className="home-profession-title" style={{ color: profession.color }}>
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