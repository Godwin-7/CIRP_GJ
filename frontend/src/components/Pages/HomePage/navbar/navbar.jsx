import React, { useEffect, useState, useRef } from "react";
import "./navbar.css";

// Import the Poppins font styles you need
import "@fontsource/poppins/400.css"; // Regular
import "@fontsource/poppins/900.css"; // Black

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));

  // Refs for section elements
  const oneRef = useRef(null);
  const aboutUsRef = useRef(null);
  const twoRef = useRef(null);
  const textSphereRef = useRef(null);
  const fourRef = useRef(null);
  const devRef = useRef(null);
  const chatbotRef = useRef(null);

  // Refs for navigation elements
  const logoRef = useRef(null);
  const navlinksRef = useRef(null);
  const homeNavRef = useRef(null);
  const aboutUsNavRef = useRef(null);
  const ideasNavRef = useRef(null);
  const textSphereNavRef = useRef(null);
  const contactNavRef = useRef(null);
  const devNavRef = useRef(null);
  const chatbotNavRef = useRef(null);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  useEffect(() => {
    // Get references to actual DOM elements
    oneRef.current = document.getElementById("one");
    aboutUsRef.current = document.getElementById("aboutUs");
    twoRef.current = document.getElementById("two");
    textSphereRef.current = document.getElementById("TextShpere");
    fourRef.current = document.getElementById("four");
    devRef.current = document.getElementById("dev");
    chatbotRef.current = document.getElementById("chatbot");

    const handleScroll = () => {
      const windoo = window.pageYOffset;

      if (
        !oneRef.current ||
        !aboutUsRef.current ||
        !twoRef.current ||
        !textSphereRef.current ||
        !fourRef.current ||
        !devRef.current ||
        !chatbotRef.current
      ) {
        return;
      }

      if (
        windoo >= oneRef.current.offsetTop &&
        windoo < aboutUsRef.current.offsetTop
      ) {
        homeNavRef.current.setAttribute("id", "active");
        aboutUsNavRef.current.removeAttribute("id");
        ideasNavRef.current.removeAttribute("id");
        textSphereNavRef.current.removeAttribute("id");
        contactNavRef.current.removeAttribute("id");
        devNavRef.current.removeAttribute("id");
        chatbotNavRef.current.removeAttribute("id");
        logoRef.current.removeAttribute("id", "blue");
      } else if (
        windoo >= aboutUsRef.current.offsetTop &&
        windoo < twoRef.current.offsetTop
      ) {
        aboutUsNavRef.current.setAttribute("id", "active6");
        homeNavRef.current.removeAttribute("id");
        ideasNavRef.current.removeAttribute("id");
        textSphereNavRef.current.removeAttribute("id");
        contactNavRef.current.removeAttribute("id");
        devNavRef.current.removeAttribute("id");
        chatbotNavRef.current.removeAttribute("id");
        logoRef.current.setAttribute("id", "blue");
      } else if (
        windoo >= twoRef.current.offsetTop &&
        windoo < textSphereRef.current.offsetTop
      ) {
        ideasNavRef.current.setAttribute("id", "active2");
        homeNavRef.current.removeAttribute("id");
        aboutUsNavRef.current.removeAttribute("id");
        textSphereNavRef.current.removeAttribute("id");
        contactNavRef.current.removeAttribute("id");
        devNavRef.current.removeAttribute("id");
        chatbotNavRef.current.removeAttribute("id");
        logoRef.current.setAttribute("id", "blue");
      } else if (
        windoo >= textSphereRef.current.offsetTop &&
        windoo < fourRef.current.offsetTop
      ) {
        textSphereNavRef.current.setAttribute("id", "active3");
        homeNavRef.current.removeAttribute("id");
        aboutUsNavRef.current.removeAttribute("id");
        ideasNavRef.current.removeAttribute("id");
        contactNavRef.current.removeAttribute("id");
        devNavRef.current.removeAttribute("id");
        chatbotNavRef.current.removeAttribute("id");
        logoRef.current.removeAttribute("id", "blue");
      } else if (
        windoo >= fourRef.current.offsetTop &&
        windoo < devRef.current.offsetTop
      ) {
        contactNavRef.current.setAttribute("id", "active4");
        homeNavRef.current.removeAttribute("id");
        aboutUsNavRef.current.removeAttribute("id");
        ideasNavRef.current.removeAttribute("id");
        textSphereNavRef.current.removeAttribute("id");
        devNavRef.current.removeAttribute("id");
        chatbotNavRef.current.removeAttribute("id");
        logoRef.current.setAttribute("id", "blue");
      } else if (
        windoo >= devRef.current.offsetTop &&
        windoo < chatbotRef.current.offsetTop
      ) {
        devNavRef.current.setAttribute("id", "active5");
        homeNavRef.current.removeAttribute("id");
        aboutUsNavRef.current.removeAttribute("id");
        ideasNavRef.current.removeAttribute("id");
        textSphereNavRef.current.removeAttribute("id");
        contactNavRef.current.removeAttribute("id");
        chatbotNavRef.current.removeAttribute("id");
        logoRef.current.removeAttribute("id", "blue");
      } else if (windoo >= chatbotRef.current.offsetTop) {
        chatbotNavRef.current.setAttribute("id", "active7");
        homeNavRef.current.removeAttribute("id");
        aboutUsNavRef.current.removeAttribute("id");
        ideasNavRef.current.removeAttribute("id");
        textSphereNavRef.current.removeAttribute("id");
        contactNavRef.current.removeAttribute("id");
        devNavRef.current.removeAttribute("id");
        logoRef.current.removeAttribute("id", "blue");
      }
    };

    window.addEventListener("scroll", handleScroll);

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  return (
    <nav className="navbar">
      <div className="logobox">
        <svg
          className="logo"
          ref={logoRef}
          viewBox="0 0 85 103"
          xmlns="http://www.w3.org/2000/svg"
        >
          </svg>
      </div>
      <div
        className={menuOpen ? "openPage" : "navlinks"}
        id="navlinks"
        ref={navlinksRef}
      >
        <a className="one" href="#one" ref={homeNavRef}>
          Home
        </a>
        <a className="aboutUs" href="#aboutUs" ref={aboutUsNavRef}>
          About Us
        </a>
        <a className="two" href="#two" ref={ideasNavRef}>
          Ideas
        </a>
        <a className="three" href="#TextShpere" ref={textSphereNavRef}>
          TextShpere
        </a>
        <a className="four" href="#four" ref={contactNavRef}>
          Contact
        </a>
        <a className="five" href="#dev" ref={devNavRef}>
          Dev
        </a>
        <a className="six" href="#chatbot" ref={chatbotNavRef}>
          Chatbot
        </a>
      </div>
      <div className="auth-buttons">
        {isLoggedIn ? (
          <button
            className="auth-btn logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        ) : (
          <a
            href="/login"
            className="auth-btn login-btn"
          >
            Login
          </a>
        )}
      </div>

      <div className="ham-right">
        <div
          className={`hamburger-menu ${menuOpen ? "open" : ""}`}
          id="hamburger-menu"
          onClick={toggleMenu}
        >
          <svg
            viewBox="0 0 22 23"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path id="top-line" d="M0 1H11H22" stroke="#E7EAEE" />
            <line
              id="bottom-line"
              y1="22.5"
              x2="22"
              y2="22.5"
              stroke="#E7EAEE"
            />
            <line
              id="middle-line"
              y1="11.5"
              x2="22"
              y2="11.5"
              stroke="#E7EAEE"
            />
          </svg>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;