import React, { useState } from 'react';
import './ContactForm.css';

const ContactForm = () => {
  const [formStatus, setFormStatus] = useState(null);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Placeholder for form submission logic
    // This would be replaced with actual form submission API call
    const success = Math.random() > 0.3; // Simulating success/failure for demo
    
    if (success) {
      setFormStatus('success');
    } else {
      setFormStatus('error');
    }
    
    // Reset form status after 3 seconds
    setTimeout(() => {
      setFormStatus(null);
    }, 3000);
  };

  return (
    <section id="contact">
      <h1 className="contact-main-heading">Contact-me</h1>
      
      {/* Form status message */}
      {formStatus && (
        <div className={`contact-form-status ${formStatus}`}>
          {formStatus === 'success' ? 'Thank You for contacting us' : 'Unable to contact'}
        </div>
      )}
      
      <div className="contact-us-desktop">
        <form 
          className="contact-gform" 
          method="POST" 
          data-email="ucoeproject@gmail.com" 
          name="google-sheet"
          onSubmit={handleSubmit}
        >
          <div className="contact-input-box">
            <input 
              type="text" 
              id="contact-name" 
              className="contact-name-input" 
              name="name" 
              required="required"
            />
            <span className="contact-label">Full Name(XYZ)</span>
          </div>
          <div className="contact-input-box">
            <input 
              type="text" 
              id="contact-email" 
              className="contact-email-input" 
              name="email" 
              required="required"
            />
            <span className="contact-label">Email Address(xyz@email.com)</span>
          </div>
          <div className="contact-input-box contact-comment-box"> 
            <textarea 
              name="message" 
              className="contact-message-area"
              id="contact-message" 
              cols="80" 
              rows="10" 
              required="required"
            ></textarea>
            <span className="contact-label">Comments/Suggestions/Complaints</span>
          </div>
          <button 
            className="contact-submit-btn" 
            type="submit" 
            id="contact-submit"
          >
            Submit
          </button>
        </form>
      </div>

      {/* Contact Image - Desktop Only */}
      <div className="contact-image-desktop">
        <img src="/images/contact-image.svg" alt="Connect Image" />
      </div>

      {/* Mobile and Tablet view contact form */}
      <div className="contact-us-mobile">
        <div className="contact-form-mobile">
          <form 
            className="contact-gform-mobile" 
            method="POST" 
            data-email="ucoeproject@gmail.com" 
            name="google-sheet"
            onSubmit={handleSubmit}
          >
            <div className="contact-image-mobile">
              <img src="/images/contact-image.svg" alt="Connect Image" />
            </div>
            <label htmlFor="contact-fname" className="contact-mobile-label">Full Name</label>
            <input 
              type="text" 
              id="contact-fname" 
              className="contact-mobile-input"
              name="fullname" 
              placeholder="Name"
            />

            <label htmlFor="contact-mobile-email" className="contact-mobile-label">Email Id</label>
            <input 
              type="text" 
              id="contact-mobile-email" 
              className="contact-mobile-input" 
              name="email" 
              placeholder="xyz@email.com" 
              required="required"
            />

            <label htmlFor="contact-mobile-subject" className="contact-mobile-label">Comments/Suggestions/Complaints</label>
            <textarea 
              id="contact-mobile-subject" 
              name="subject" 
              className="contact-mobile-textarea"
              placeholder="Comments....." 
              style={{ height: "200px" }}
            ></textarea>
            <button 
              className="contact-mobile-submit-btn" 
              type="submit" 
              id="contact-mobile-submit"
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;