// DomainAdder.jsx
import React, { useState } from "react";
import axios from "axios";
import "./DomainAdder.css";
import { useNavigate } from "react-router-dom";

const DomainAdder = () => {
  const [formData, setFormData] = useState({
    title: "",
    image: null,
    description: "",
    easyTopics: "",
    mediumTopics: "",
    hardTopics: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, image: e.target.files[0] });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error("Title is required");
      }
      if (!formData.description.trim()) {
        throw new Error("Description is required");
      }
      if (!formData.image) {
        throw new Error("Image is required");
      }

      // Check authentication
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to add a new domain.");
        navigate("/login");
        return;
      }

      // Prepare form data
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title.trim());
      formDataToSend.append("image", formData.image);
      formDataToSend.append("description", formData.description.trim());

      // Prepare topics object
      const topics = {
        easy: formData.easyTopics
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item),
        medium: formData.mediumTopics
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item),
        hard: formData.hardTopics
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item),
      };

      // Ensure at least one topic in one difficulty level
      if (topics.easy.length === 0 && topics.medium.length === 0 && topics.hard.length === 0) {
        throw new Error("Please add at least one topic in any difficulty level");
      }

      formDataToSend.append("topics", JSON.stringify(topics));

      console.log("Sending request to:", "http://localhost:5000/api/domains");
      console.log("Form data:", {
        title: formData.title,
        description: formData.description,
        topics: topics,
        hasImage: !!formData.image
      });

      // Make the API call - using the correct endpoint that matches your routes
      const response = await axios.post(
        "http://localhost:5000/api/domains",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          timeout: 30000, // 30 second timeout
        }
      );

      console.log("Success response:", response.data);
      alert("Domain added successfully!");
      
      // Clear the form after successful submission
      setFormData({
        title: "",
        image: null,
        description: "",
        easyTopics: "",
        mediumTopics: "",
        hardTopics: "",
      });
      
      // Clear file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = null;

      // Optionally redirect to domains page
      navigate("/domains");

    } catch (error) {
      console.error("Error details:", error);
      
      let errorMessage = "Failed to add domain. ";
      
      if (error.response) {
        // Server responded with error status
        console.error("Server error response:", error.response.data);
        errorMessage += error.response.data.message || `Server error: ${error.response.status}`;
        
        if (error.response.data.errors) {
          // Validation errors
          const validationErrors = error.response.data.errors.map(err => err.msg).join(", ");
          errorMessage += ` Validation errors: ${validationErrors}`;
        }
      } else if (error.request) {
        // Network error
        console.error("Network error:", error.request);
        errorMessage += "Network error - please check your connection and server status.";
      } else if (error.message) {
        // Client-side error
        errorMessage += error.message;
      } else {
        errorMessage += "Unknown error occurred.";
      }
      
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="add-domain-page">
      <h1>Add a New Domain</h1>
      
      {error && (
        <div className="error-message" style={{
          background: '#fee',
          border: '1px solid #fcc',
          color: '#c00',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="add-domain-form">
        <div className="form-group">
          <label>Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="Enter domain title"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label>Image *</label>
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleFileChange}
            required
            disabled={isLoading}
          />
          <small>Supported formats: JPG, PNG, GIF. Max size: 5MB</small>
        </div>

        <div className="form-group">
          <label>Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
            placeholder="Enter domain description (10-1000 characters)"
            disabled={isLoading}
          ></textarea>
          <small>{formData.description.length}/1000 characters</small>
        </div>

        <div className="form-group">
          <label>Easy Topics (comma-separated)</label>
          <input
            type="text"
            name="easyTopics"
            value={formData.easyTopics}
            onChange={handleChange}
            placeholder="e.g., HTML, CSS, Basic Concepts"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label>Medium Topics (comma-separated)</label>
          <input
            type="text"
            name="mediumTopics"
            value={formData.mediumTopics}
            onChange={handleChange}
            placeholder="e.g., React, Node.js, API Integration"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label>Hard Topics (comma-separated)</label>
          <input
            type="text"
            name="hardTopics"
            value={formData.hardTopics}
            onChange={handleChange}
            placeholder="e.g., Machine Learning, Cloud Architecture"
            disabled={isLoading}
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          style={{
            backgroundColor: isLoading ? '#ccc' : '#007bff',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Adding Domain...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

export default DomainAdder;