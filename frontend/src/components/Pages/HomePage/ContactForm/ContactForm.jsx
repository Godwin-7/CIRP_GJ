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
    <section id="four">
      <h1 id="even-h1">Contact-me</h1>
      
      {/* Form status message */}
      {formStatus && (
        <div className={`form-status ${formStatus}`}>
          {formStatus === 'success' ? 'Thank You for contacting us' : 'Unable to contact'}
        </div>
      )}
      
      <div className="contact-us">
        <form 
          className="gform" 
          method="POST" 
          data-email="ucoeproject@gmail.com" 
          name="google-sheet"
          onSubmit={handleSubmit}
        >
          <div className="cnt-bx">
            <input 
              type="text" 
              id="name" 
              className="name" 
              name="name" 
              required="required"
            />
            <span>Full Name(XYZ)</span>
          </div>
          <div className="cnt-bx">
            <input 
              type="text" 
              id="email" 
              className="email" 
              name="email" 
              required="required"
            />
            <span>Email Address(xyz@email.com)</span>
          </div>
          <div className="cnt-bx comment-box"> 
            <textarea 
              name="message" 
              className="message-area"  // Changed from "message" to "message-area"
              id="message" 
              cols="80" 
              rows="10" 
              required="required"
            ></textarea>
            <span>Comments/Suggestions/Complaints</span>
          </div>
          <button 
            className="cnt-btn" 
            type="submit" 
            id="contact"
          >
            Submit
          </button>
        </form>
      </div>

      {/* Contact Image - Ensuring Visibility */}
      <div className="cnt-img">
        <img src="/images/contact-image.svg" alt="Connect Image" />
      </div>

      {/* Mobile view contact form */}
      <div className="contact-us-mob">
        <div className="contact-us-form">
          <form 
            className="gform" 
            method="POST" 
            data-email="ucoeproject@gmail.com" 
            name="google-sheet"
            onSubmit={handleSubmit}
          >
            <div className="cnt-img-mob">
              <img src="/images/contact-image.svg" alt="Connect Image" />
            </div>
            <label htmlFor="fname">Full Name</label>
            <input 
              type="text" 
              id="fname" 
              name="fullname" 
              placeholder="Name"
            />

            <label htmlFor="email">Email Id</label>
            <input 
              type="text" 
              id="email" 
              className="email" 
              name="email" 
              placeholder="xyz@email.com" 
              required="required"
            />

            <label htmlFor="subject">Comments/Suggestions/Complaints</label>
              <textarea 
                id="subject" 
                name="subject" 
                className="message-area-mobile"  // Add this class
                placeholder="Comments....." 
                style={{ height: "200px" }}
            ></textarea>
            <button 
              className="cnt-mob-btn" 
              type="submit" 
              id="contact"
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