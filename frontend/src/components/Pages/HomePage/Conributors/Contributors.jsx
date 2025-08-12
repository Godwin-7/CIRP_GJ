import React, { useEffect } from "react";
import "./Contributors.css"; 
import TagCloud from "TagCloud"; 

const Contributors = () => { 
   // Animation settings for Text Cloud 
   useEffect(() => { 
       const container = ".contributors-tagcloud"; 
       const texts = [ 
           "HTML", 
           "CSS", 
           "SASS", 
           "JavaScript", 
           "React", 
           "Vue", 
           "Nuxt", 
           "NodeJS",
           "Babel", 
           "Jquery", 
           "ES6" ,
           "GIT", 
           "GITHUB", 
       ];

       // Dynamic radius based on screen size
       const getRadius = () => {
           const width = window.innerWidth;
           if (width <= 480) return 120; // Mobile
           if (width <= 768) return 180; // Tablet
           if (width <= 1024) return 220; // Small desktop
           if (width <= 1440) return 280; // Medium desktop
           return 320; // Large desktop
       };

       const options = { 
           radius: getRadius(), 
           maxSpeed: "normal", 
           initSpeed: "normal", 
           keep: true, 
       };

       // Handle window resize
       const handleResize = () => {
           const element = document.querySelector('.contributors-tagcloud');
           if (element) {
               element.innerHTML = '';
               setTimeout(() => {
                   TagCloud(container, texts, {
                       ...options,
                       radius: getRadius()
                   });
               }, 100);
           }
       };

       window.addEventListener('resize', handleResize); 

       TagCloud(container, texts, options); 

       // Cleanup function
       return () => {
           window.removeEventListener('resize', handleResize);
           const element = document.querySelector('.contributors-tagcloud');
           if (element) {
               element.innerHTML = '';
           }
       }; 
   }, []); 

   return ( 
       <> 
           <section id="contributors">  
               <div className="contributors-left-section">
                   <div className="contributors-header">
                       <img src="./images/home-graphic.svg" alt="Contributors" className="contributors-image" />
                       <h1 className="contributors-title">Thank You to Our Contributors</h1>
                   </div>
                   <div className="contributors-description">
                       <p>
                           We are deeply grateful to the talented authors and developers who have contributed their expertise to this project. Their dedication and experience have been instrumental in bringing this vision to life.
                       </p>
                       <div className="contributors-highlight">
                           <p>
                               Special thanks to <span className="contributor-name">Godwin</span>, a Frontend Developer with over 5 years of experience in React and JavaScript, <span className="contributor-name">Sathish</span>, a Fullstack Developer specializing in Node.js and Vue.js, and <span className="contributor-name">Sundar</span>, a UI/UX Designer with a passion for creating stunning user interfaces.
                           </p>
                       </div>
                       <p className="contributors-conclusion">
                           Their collective efforts have made this project a success.
                       </p>
                   </div>
               </div>
               <div className="contributors-text-sphere"> 
                   <span className="contributors-tagcloud"></span> 
               </div> 
           </section>
       </> 
   ); 
}; 

export default Contributors;