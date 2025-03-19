import React, { useEffect } from "react";
import "./TextShpere.css"; 
import TagCloud from "TagCloud"; 

const TextShpere = () => { 
   // Animation settings for Text Cloud 
   useEffect(() => { 
       const container = ".tagcloud"; 
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

       const options = { 
           radius: 300, 
           maxSpeed: "normal", 
           initSpeed: "normal", 
           keep: true, 
       }; 

       TagCloud(container, texts, options); 

       // Cleanup function
       return () => {
           const element = document.querySelector('.tagcloud');
           if (element) {
               element.innerHTML = '';
           }
       }; 
   }, []); 

   return ( 
       <> 
           <section id="TextShpere">  
               <div className="left-section">
                   <div className="header">
                       <img src="./images/home-graphic.svg" alt="Contributors" className="contributors-image" />
                       <h1 className="title">Thank You to Our Contributors</h1>
                   </div>
                   <p className="description">
                       We are deeply grateful to the talented authors and developers who have contributed their expertise to this project. Their dedication and experience have been instrumental in bringing this vision to life. Special thanks to Godwin, a Frontend Developer with over 5 years of experience in React and JavaScript, Sathish, a Fullstack Developer specializing in Node.js and Vue.js, and Sundar, a UI/UX Designer with a passion for creating stunning user interfaces. Their collective efforts have made this project a success.
                   </p>
               </div>
               <div className="text-shpere"> 
                   <span className="tagcloud"></span> 
               </div> 
           </section>
       </> 
   ); 
}; 

export default TextShpere;