import React, { useEffect } from 'react';
import anime from 'animejs/lib/anime.es.js';
import './Home.css';

const Home = () => {
  useEffect(() => {
    // Text animation
    const heading = {
      opacityIn: [0, 1],
      scaleIn: [0.2, 1],
      scaleOut: 3,
      durationIn: 800,
      durationOut: 600,
      delay: 500
    };

    anime.timeline({ loop: true })
      .add({
        targets: '.intro-1',
        opacity: heading.opacityIn,
        scale: heading.scaleIn,
        duration: heading.durationIn
      })
      .add({
        targets: '.intro-1',
        opacity: 0,
        scale: heading.scaleOut,
        duration: heading.durationOut,
        easing: "easeInExpo",
        delay: heading.delay
      })
      .add({
        targets: '.intro-2',
        opacity: heading.opacityIn,
        scale: heading.scaleIn,
        duration: heading.durationIn
      })
      .add({
        targets: '.intro-2',
        opacity: 0,
        scale: heading.scaleOut,
        duration: heading.durationOut,
        easing: "easeInExpo",
        delay: heading.delay
      })
      .add({
        targets: '.intro-3',
        opacity: heading.opacityIn,
        scale: heading.scaleIn,
        duration: heading.durationIn
      })
      .add({
        targets: '.intro-3',
        opacity: 0,
        scale: heading.scaleOut,
        duration: heading.durationOut,
        easing: "easeInExpo",
        delay: heading.delay
      });
  }, []);

  return (
    <section id="one">
      <div className="left">
        <div className="head-wrapper">
          <h1 className="heading">
            <span className="intro intro-1" style={{ color: 'cyan' }}>Collaborative</span>
            <span className="intro intro-2" style={{ color: 'cyan' }}>Idea Research</span>
            <span className="intro intro-3" style={{ color: 'cyan' }}>Platform</span>
          </h1>
        </div>
      </div>

      <div className="right">
      <div className="rotating-circle-container" style={{ width: '1000px', height: '1000px' }}>
    <div className="rotating-circle">
        <div className="circle-text" data-rotation="0"><b>Solar</b></div>
        <div className="circle-text" data-rotation="72"><b>Wind</b></div>
        <div className="circle-text" data-rotation="144"><b>Electricity</b></div>
        <div className="circle-text" data-rotation="216"><b>AI & ML</b></div>
        <div className="circle-text" data-rotation="288"><b>Land</b></div>
    </div>
    <div className="static-image">
        <img 
            src="/images/home-graphic.jpeg" 
            style={{ zIndex: 1 }} 
            alt="home image" 
            className="home-image"
        />
    </div>
</div>
        </div>
      
    </section>
  );
};

export default Home;
