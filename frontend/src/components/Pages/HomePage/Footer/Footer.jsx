import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-section">
          <div className="footer-logo">
            <svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
              <text x="10" y="30" fontFamily="Arial" fontSize="24" fontWeight="bold" fill="#E7EAEE">CIRP</text>
              <circle cx="100" cy="20" r="15" fill="none" stroke="#E7EAEE" strokeWidth="2" />
              <path d="M92 20 L108 20 M100 12 L100 28" stroke="#E7EAEE" strokeWidth="2" />
            </svg>
          </div>
          <p className="footer-tagline">Collaborative Idea Research Platform</p>
          <p className="footer-description">
            Creating sustainable solutions for a better future through innovative projects and websites for connecting and collaborating people.
          </p>
        </div>
        
        <div className="footer-section">
          <h3>Reach Us</h3>
          <div className="contact-info">
            <div className="contact-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E7EAEE" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <span>cirp_project@gmail.com</span>
            </div>
            <div className="contact-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E7EAEE" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <span>+91 9999999999</span>
            </div>
            <div className="contact-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E7EAEE" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>Chennai, India</span>
            </div>
          </div>
        </div>
        
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul className="footer-links">
            <li><a href="#">About</a></li>
            <li><a href="#">F.A.Q</a></li>
            <li><a href="#">Terms & Conditions</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Contact Us</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Stay Updated</h3>
          <p className="newsletter-text">Subscribe to our newsletter for the latest updates</p>
          <div className="newsletter-form">
            <input type="email" placeholder="example@email.com" />
            <button type="submit">Subscribe</button>
          </div>
          <div className="social-icons">
            <a href="#" aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E7EAEE" strokeWidth="2">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </a>
            <a href="#" aria-label="Twitter">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E7EAEE" strokeWidth="2">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
              </svg>
            </a>
            <a href="#" aria-label="LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E7EAEE" strokeWidth="2">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                <rect x="2" y="9" width="4" height="12"></rect>
                <circle cx="4" cy="4" r="2"></circle>
              </svg>
            </a>
            <a href="#" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E7EAEE" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="copyright">
          <p>&copy; {new Date().getFullYear()} CIRP. All Rights Reserved.</p>
          <p><em>This website was created by the GSS CSE Team for Miniproject 24-25 for Computer Science Department , Velammal Engineering College</em></p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;