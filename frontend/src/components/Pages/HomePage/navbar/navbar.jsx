import React, { useEffect, useState, useRef } from "react";
import "./navbar.css";

// Import the Poppins font styles you need
import "@fontsource/poppins/400.css"; // Regular
import "@fontsource/poppins/900.css"; // Black

const Navbar = () => {
  const [navbarMenuOpen, setNavbarMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [navbarActiveSection, setNavbarActiveSection] = useState('home');
  const [navbarTheme, setNavbarTheme] = useState('light');
  const [navbarVisible, setNavbarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isMouseMoving, setIsMouseMoving] = useState(false);
  
  const scrollTimeoutRef = useRef(null);
  const mouseTimeoutRef = useRef(null);
  const inactivityTimeoutRef = useRef(null);

  // Configuration for navbar sections - easily modifiable for future changes
  const navbarSections = [
    { id: 'home', label: 'Home', theme: 'light' },
    { id: 'about', label: 'About', theme: 'dark' },
    { id: 'ideas', label: 'Ideas', theme: 'dark' },
    { id: 'contributors', label: 'Contributors', theme: 'light' },
    { id: 'contact', label: 'Contact', theme: 'dark' },
    { id: 'developers', label: 'Developers', theme: 'light' },
    { id: 'chatbot', label: 'Chatbot', theme: 'light' }
  ];

  // Refs for navigation elements
  const navbarLogoRef = useRef(null);
  const navbarLinksRef = useRef(null);
  const navbarNavRefs = useRef({});

  const toggleNavbarMenu = () => {
    setNavbarMenuOpen(!navbarMenuOpen);
  };

  const closeNavbarMenu = () => {
    setNavbarMenuOpen(false);
  };

  const startInactivityTimer = () => {
    // Clear any existing timer
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    
    // Only start timer if not scrolling and not moving mouse
    if (!isScrolling && !isMouseMoving) {
      inactivityTimeoutRef.current = setTimeout(() => {
        setNavbarVisible(false);
      }, 3000); // Hide after 3 seconds of inactivity
    }
  };

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    
    // Initialize refs for each section
    navbarSections.forEach(section => {
      navbarNavRefs.current[section.id] = React.createRef();
    });

    const handleNavbarScroll = () => {
      const scrollPosition = window.pageYOffset + 100;
      const currentScrollY = window.pageYOffset;
      
      let currentSection = 'home';
      let currentTheme = 'light';

      // Find current section based on scroll position
      for (let i = navbarSections.length - 1; i >= 0; i--) {
        const section = navbarSections[i];
        const element = document.getElementById(section.id);
        
        if (element && scrollPosition >= element.offsetTop) {
          currentSection = section.id;
          currentTheme = section.theme;
          break;
        }
      }

      setNavbarActiveSection(currentSection);
      setNavbarTheme(currentTheme);

      // Show navbar and mark as scrolling
      setIsScrolling(true);
      setNavbarVisible(true);
      setLastScrollY(currentScrollY);

      // Clear existing scroll timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set scrolling to false after scroll stops
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150); // Shorter delay to detect scroll stop faster
    };

    const handleMouseMove = () => {
      setIsMouseMoving(true);
      setNavbarVisible(true);
      
      // Clear existing mouse timeout
      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current);
      }

      // Set mouse moving to false after movement stops
      mouseTimeoutRef.current = setTimeout(() => {
        setIsMouseMoving(false);
      }, 300); // Shorter delay
    };

    const handleMouseEnter = () => {
      setNavbarVisible(true);
      setIsMouseMoving(true);
    };

    const handleMouseLeave = () => {
      setIsMouseMoving(false);
    };

    // Add event listeners
    window.addEventListener("scroll", handleNavbarScroll);
    document.addEventListener("mousemove", handleMouseMove);
    
    // Add mouse enter/leave specifically for navbar
    const navbarElement = document.getElementById('navbar');
    if (navbarElement) {
      navbarElement.addEventListener("mouseenter", handleMouseEnter);
      navbarElement.addEventListener("mouseleave", handleMouseLeave);
    }
    
    // Initial call
    handleNavbarScroll();

    return () => {
      window.removeEventListener("scroll", handleNavbarScroll);
      document.removeEventListener("mousemove", handleMouseMove);
      
      if (navbarElement) {
        navbarElement.removeEventListener("mouseenter", handleMouseEnter);
        navbarElement.removeEventListener("mouseleave", handleMouseLeave);
      }
      
      // Clear all timeouts
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current);
      }
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };
  }, []);

  // Effect to handle inactivity timer based on scroll and mouse state
  useEffect(() => {
    startInactivityTimer();
  }, [isScrolling, isMouseMoving]);

  // Handle logout
  const handleNavbarLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  return (
    <>
      {/* Mobile menu backdrop */}
      {navbarMenuOpen && (
        <div 
          className={`navbar-menu-backdrop ${navbarMenuOpen ? 'navbar-backdrop-open' : ''}`}
          onClick={() => setNavbarMenuOpen(false)}
        />
      )}

      {/* Mobile menu - positioned outside navbar container */}
      {navbarMenuOpen && (
        <div
          className={`navbar-openpage ${navbarMenuOpen ? "navbar-menu-open" : ""}`}
          id="navbar-mobile-menu"
        >
          {navbarSections.map((section, index) => (
            <a 
              key={section.id}
              className={`navbar-link navbar-link-${section.id} ${navbarActiveSection === section.id ? 'navbar-active' : ''}`}
              href={`#${section.id}`}
              onClick={closeNavbarMenu}
            >
              {section.label}
            </a>
          ))}
        </div>
      )}

      <section id="navbar">
        <nav className={`navbar-container ${navbarTheme === 'dark' ? 'navbar-dark-theme' : 'navbar-light-theme'} ${navbarVisible ? 'navbar-visible' : 'navbar-hidden'}`}>
          {/* Logo Section - 10% width */}
          <div className="navbar-logobox">
            <svg
              className="navbar-logo"
              ref={navbarLogoRef}
              viewBox="0 0 85 103"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="42.5" cy="51.5" r="40" fill="currentColor" />
            </svg>
          </div>
          
          {/* Free Space - 15% width */}
          <div className="navbar-spacer-left"></div>
          
          {/* Navigation Links - 55% width (desktop only) */}
          <div
            className="navbar-links"
            id="navbar-links"
            ref={navbarLinksRef}
          >
            {navbarSections.map((section, index) => (
              <a 
                key={section.id}
                className={`navbar-link navbar-link-${section.id} ${navbarActiveSection === section.id ? 'navbar-active' : ''}`}
                href={`#${section.id}`}
                ref={el => navbarNavRefs.current[section.id] = el}
              >
                {section.label}
              </a>
            ))}
          </div>

          {/* Free Space - 5% width */}
          <div className="navbar-spacer-right"></div>

          {/* Auth Buttons - 15% width */}
          <div className="navbar-auth-buttons">
            {isLoggedIn ? (
              <button
                className="navbar-auth-btn navbar-logout-btn"
                onClick={handleNavbarLogout}
              >
                Logout
              </button>
            ) : (
              <a
                href="/login"
                className="navbar-auth-btn navbar-login-btn"
              >
                Login
              </a>
            )}
          </div>

          <div className="navbar-ham-right">
            <div
              className={`navbar-hamburger-menu ${navbarMenuOpen ? "navbar-open" : ""}`}
              id="navbar-hamburger-menu"
              onClick={toggleNavbarMenu}
            >
              <svg
                viewBox="0 0 22 23"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path id="navbar-top-line" d="M0 1H11H22" stroke="currentColor" />
                <line
                  id="navbar-bottom-line"
                  y1="22.5"
                  x2="22"
                  y2="22.5"
                  stroke="currentColor"
                />
                <line
                  id="navbar-middle-line"
                  y1="11.5"
                  x2="22"
                  y2="11.5"
                  stroke="currentColor"
                />
              </svg>
            </div>
          </div>
        </nav>
      </section>
    </>
  );
};

export default Navbar;