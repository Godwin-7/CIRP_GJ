// UserForm.jsx - Enhanced with file size validation
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./UserForm.css";

const UserForm = () => {
  const navigate = useNavigate();
  const [domains, setDomains] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    detailedDescription: "",
    difficulty: "",
    category: "Research",
    status: "Not yet started",
    tags: "",
    requiredSkills: "",
    domainId: "",
    projectImage: null,
    additionalImages: [],
    projectPdf: null,
    relatedLinks: [{ title: "", url: "", description: "", type: "other" }],
    selectedAuthorId: "",
    authorName: "",
    authorEmail: "",
    authorPhone: "",
    authorPhoto: null,
    socialMediaLink: "",
    socialMediaType: "whatsapp",
    professionalDetails: "",
    estimatedDuration: { value: "", unit: "weeks" },
    scope: { shortTerm: "", longTerm: "", limitations: "", assumptions: "" },
    futureEnhancements: [{ title: "", description: "", priority: "medium" }]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState({ type: "", message: "" });

  // File size constants (in bytes)
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper function to validate file size
  const validateFileSize = (file, maxSize, fileType) => {
    if (file && file.size > maxSize) {
      const maxSizeFormatted = formatFileSize(maxSize);
      const fileSizeFormatted = formatFileSize(file.size);
      throw new Error(`${fileType} file size (${fileSizeFormatted}) exceeds maximum limit of ${maxSizeFormatted}`);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const domainResponse = await axios.get("http://localhost:5000/api/domains", { headers });
        console.log("Domain response:", domainResponse.data);
        
        // Handle different response formats
        if (domainResponse.data.data && Array.isArray(domainResponse.data.data.domains)) {
          setDomains(domainResponse.data.data.domains);
        } else if (Array.isArray(domainResponse.data)) {
          setDomains(domainResponse.data);
        } else {
          console.warn("Unexpected domain response format:", domainResponse.data);
          setDomains([]);
        }

        const authorResponse = await axios.get("http://localhost:5000/api/authors", { headers });
        console.log("Author response:", authorResponse.data);
        
        // Handle different response formats
        if (authorResponse.data.data && Array.isArray(authorResponse.data.data.authors)) {
          setAuthors(authorResponse.data.data.authors);
        } else if (Array.isArray(authorResponse.data)) {
          setAuthors(authorResponse.data);
        } else {
          console.warn("Unexpected author response format:", authorResponse.data);
          setAuthors([]);
        }

      } catch (error) {
        console.error("Error fetching data", error);
        setFormMessage({ 
          type: "error", 
          message: "Failed to load domains and authors. Please refresh the page." 
        });
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error when user starts typing
    if (formMessage.message) {
      setFormMessage({ type: "", message: "" });
    }
  };

  const handleAuthorSelection = (e) => {
    const selectedAuthorId = e.target.value;
    setFormData({ ...formData, selectedAuthorId });
  };

  const handleLinkChange = (index, field, value) => {
    const newLinks = [...formData.relatedLinks];
    newLinks[index][field] = value;
    setFormData({ ...formData, relatedLinks: newLinks });
  };

  const addLinkField = () => {
    setFormData({
      ...formData,
      relatedLinks: [...formData.relatedLinks, { title: "", url: "", description: "", type: "other" }],
    });
  };

  const removeLinkField = (index) => {
    const newLinks = formData.relatedLinks.filter((_, i) => i !== index);
    setFormData({ ...formData, relatedLinks: newLinks });
  };

  const handleSingleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    
    if (file) {
      try {
        // Validate file size based on file type
        if (name === 'projectImage' || name === 'authorPhoto') {
          validateFileSize(file, MAX_IMAGE_SIZE, 'Image');
        } else if (name === 'projectPdf') {
          validateFileSize(file, MAX_PDF_SIZE, 'PDF');
        }
        
        setFormData({ ...formData, [name]: file });
        
        // Clear any previous error messages
        if (formMessage.type === 'error' && formMessage.message.includes('file size')) {
          setFormMessage({ type: "", message: "" });
        }
      } catch (error) {
        // Clear the file input
        e.target.value = '';
        setFormMessage({ type: "error", message: error.message });
      }
    } else {
      setFormData({ ...formData, [name]: null });
    }
  };

  const handleMultipleFileChange = (e) => {
    const { name, files } = e.target;
    const fileArray = Array.from(files);
    
    try {
      // Validate each file size for additional images
      if (name === 'additionalImages') {
        fileArray.forEach((file, index) => {
          validateFileSize(file, MAX_IMAGE_SIZE, `Additional image ${index + 1}`);
        });
        
        // Check total number of additional images (max 5)
        if (fileArray.length > 5) {
          throw new Error('Maximum 5 additional images allowed');
        }
      }
      
      setFormData({ ...formData, [name]: fileArray });
      
      // Clear any previous error messages
      if (formMessage.type === 'error' && formMessage.message.includes('file size')) {
        setFormMessage({ type: "", message: "" });
      }
    } catch (error) {
      // Clear the file input
      e.target.value = '';
      setFormMessage({ type: "error", message: error.message });
    }
  };

  const handleNestedChange = (parentField, childField, value) => {
    setFormData({
      ...formData,
      [parentField]: {
        ...formData[parentField],
        [childField]: value
      }
    });
  };

  const handleEnhancementChange = (index, field, value) => {
    const newEnhancements = [...formData.futureEnhancements];
    newEnhancements[index][field] = value;
    setFormData({ ...formData, futureEnhancements: newEnhancements });
  };

  const addEnhancementField = () => {
    setFormData({
      ...formData,
      futureEnhancements: [...formData.futureEnhancements, { title: "", description: "", priority: "medium" }],
    });
  };

  const removeEnhancementField = (index) => {
    const newEnhancements = formData.futureEnhancements.filter((_, i) => i !== index);
    setFormData({ ...formData, futureEnhancements: newEnhancements });
  };

  const validateForm = () => {
    const errors = [];

    // Required field validation
    if (!formData.title.trim() || formData.title.length < 5 || formData.title.length > 200) {
      errors.push("Title must be between 5 and 200 characters");
    }

    if (!formData.description.trim() || formData.description.length < 20 || formData.description.length > 2000) {
      errors.push("Description must be between 20 and 2000 characters");
    }

    if (!formData.domainId) {
      errors.push("Please select a domain");
    }

    if (!formData.difficulty) {
      errors.push("Please select a difficulty level");
    }

    if (formData.selectedAuthorId === "new") {
      if (!formData.authorName.trim()) {
        errors.push("Author name is required");
      }
      if (!formData.authorEmail.trim()) {
        errors.push("Author email is required");
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (formData.authorEmail && !emailRegex.test(formData.authorEmail)) {
        errors.push("Please enter a valid email address");
      }
    } else if (!formData.selectedAuthorId) {
      errors.push("Please select an author or choose to add a new one");
    }

    // File size validation (double-check before submission)
    try {
      if (formData.projectImage) {
        validateFileSize(formData.projectImage, MAX_IMAGE_SIZE, 'Project image');
      }
      if (formData.authorPhoto) {
        validateFileSize(formData.authorPhoto, MAX_IMAGE_SIZE, 'Author photo');
      }
      if (formData.projectPdf) {
        validateFileSize(formData.projectPdf, MAX_PDF_SIZE, 'Project PDF');
      }
      if (formData.additionalImages && formData.additionalImages.length > 0) {
        formData.additionalImages.forEach((file, index) => {
          validateFileSize(file, MAX_IMAGE_SIZE, `Additional image ${index + 1}`);
        });
      }
    } catch (error) {
      errors.push(error.message);
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormMessage({ type: "", message: "" });

    try {
      // Validate form
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(", "));
      }

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required. Please log in.");
      }

      let authorId;
      if (formData.selectedAuthorId === "new") {
        console.log("Creating new author...");
        
        // Create FormData for author with photo
        const authorFormData = new FormData();
        authorFormData.append("authorName", formData.authorName.trim());
        authorFormData.append("authorEmail", formData.authorEmail.trim());
        authorFormData.append("bio", formData.professionalDetails.trim() || "");
        
        if (formData.authorPhone.trim()) {
          authorFormData.append("phone", formData.authorPhone.trim());
        }
        
        if (formData.socialMediaLink.trim()) {
          authorFormData.append("socialMedia", JSON.stringify([{
            platform: formData.socialMediaType,
            url: formData.socialMediaLink.trim()
          }]));
        }
        
        if (formData.authorPhoto) {
          authorFormData.append("authorPhoto", formData.authorPhoto);
        }
        
        const authorResponse = await axios.post("http://localhost:5000/api/authors", authorFormData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        });
        
        console.log("Author creation response:", authorResponse.data);
        
        // Handle different response formats
        if (authorResponse.data.data && authorResponse.data.data.author) {
          authorId = authorResponse.data.data.author._id;
        } else if (authorResponse.data._id) {
          authorId = authorResponse.data._id;
        } else {
          throw new Error("Failed to create author - invalid response format");
        }
        console.log("Created author ID:", authorId);
      } else {
        authorId = formData.selectedAuthorId;
      }

      // Prepare form data
      const formDataToSend = new FormData();
      
      // Basic required fields
      formDataToSend.append("title", formData.title.trim());
      formDataToSend.append("description", formData.description.trim());
      formDataToSend.append("domainId", formData.domainId);
      formDataToSend.append("authorId", authorId);
      formDataToSend.append("difficulty", formData.difficulty);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("status", formData.status);

      // Optional detailed description
      if (formData.detailedDescription.trim()) {
        formDataToSend.append("detailedDescription", formData.detailedDescription.trim());
      }

      // Process tags as JSON array
      if (formData.tags.trim()) {
        const tagsArray = formData.tags.split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0);
        formDataToSend.append("tags", JSON.stringify(tagsArray));
      }

      // Process required skills as JSON array with proper structure
      if (formData.requiredSkills.trim()) {
        const skillsArray = formData.requiredSkills.split(',')
          .map(skill => ({ 
            skill: skill.trim(), 
            level: 'intermediate' 
          }))
          .filter(skill => skill.skill.length > 0);
        formDataToSend.append("requiredSkills", JSON.stringify(skillsArray));
      }

      // Process estimated duration
      if (formData.estimatedDuration.value) {
        formDataToSend.append("estimatedDuration", JSON.stringify({
          value: parseInt(formData.estimatedDuration.value),
          unit: formData.estimatedDuration.unit
        }));
      }

      // Process scope
      const scopeData = {};
      if (formData.scope.shortTerm) scopeData.shortTerm = formData.scope.shortTerm.split(',').map(s => s.trim()).filter(s => s);
      if (formData.scope.longTerm) scopeData.longTerm = formData.scope.longTerm.split(',').map(s => s.trim()).filter(s => s);
      if (formData.scope.limitations) scopeData.limitations = formData.scope.limitations.split(',').map(s => s.trim()).filter(s => s);
      if (formData.scope.assumptions) scopeData.assumptions = formData.scope.assumptions.split(',').map(s => s.trim()).filter(s => s);
      
      if (Object.keys(scopeData).length > 0) {
        formDataToSend.append("scope", JSON.stringify(scopeData));
      }

      // Process future enhancements
      const validEnhancements = formData.futureEnhancements
        .filter(enhancement => enhancement.title.trim() && enhancement.description.trim());
      if (validEnhancements.length > 0) {
        formDataToSend.append("futureEnhancements", JSON.stringify(validEnhancements));
      }

      // Process related links
      const validLinks = formData.relatedLinks
        .filter(link => link.url.trim())
        .map(link => ({
          title: link.title.trim() || "Related Link",
          url: link.url.trim(),
          description: link.description.trim() || "",
          type: link.type || "other"
        }));
      
      if (validLinks.length > 0) {
        formDataToSend.append("relatedLinks", JSON.stringify(validLinks));
      }

      // Handle file uploads
      if (formData.projectImage) {
        formDataToSend.append("projectImage", formData.projectImage);
      }
      
      if (formData.projectPdf) {
        formDataToSend.append("projectPdf", formData.projectPdf);
      }
      
      if (formData.additionalImages && formData.additionalImages.length > 0) {
        formData.additionalImages.forEach((file, index) => {
          formDataToSend.append("additionalImages", file);
          // Add captions if available
          formDataToSend.append(`imageCaption${index}`, `Additional image ${index + 1}`);
        });
      }

      console.log("Submitting form data...");
      console.log("Form fields being sent:", {
        title: formData.title,
        description: formData.description.substring(0, 50) + "...",
        domainId: formData.domainId,
        authorId,
        difficulty: formData.difficulty,
        category: formData.category,
        status: formData.status,
        hasProjectImage: !!formData.projectImage,
        hasProjectPdf: !!formData.projectPdf,
        additionalImagesCount: formData.additionalImages?.length || 0
      });

      const response = await axios.post("http://localhost:5000/api/ideas", formDataToSend, {
        headers: { 
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        },
        timeout: 30000 // 30 second timeout
      });

      console.log("Success response:", response.data);
      setFormMessage({ type: "success", message: "Your idea was submitted successfully!" });
      
      setTimeout(() => {
        navigate(`/domains/${formData.domainId}`);
      }, 2000);

    } catch (err) {
      console.error("Error submitting form", err);
      let errorMessage = "There was an error submitting your idea. ";
      
      if (err.response && err.response.data) {
        console.error("Server error response:", err.response.data);
        errorMessage += err.response.data.message || `Server error: ${err.response.status}`;
        
        if (err.response.data.errors) {
          const validationErrors = err.response.data.errors.map(error => error.msg).join(", ");
          errorMessage += ` Validation errors: ${validationErrors}`;
        }
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += "Please try again.";
      }
      
      setFormMessage({
        type: "error",
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-project-page">
      <div className="add-project-form">
        <h2>Submit Your Idea</h2>
        <p>Share your innovative concept with our community</p>

        {formMessage.message && (
          <div className={`error-message ${formMessage.type === "success" ? "success" : "error"}`}>
            {formMessage.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Project Details</h3>
            
            <div className="form-group">
              <label>Domain Area *</label>
              <select name="domainId" value={formData.domainId} onChange={handleChange} required>
                <option value="">Select a Domain</option>
                {Array.isArray(domains) && domains.map((domain) => (
                  <option key={domain._id} value={domain._id}>
                    {domain.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Project Title *</label>
              <input 
                type="text" 
                name="title" 
                value={formData.title} 
                onChange={handleChange} 
                required 
                placeholder="Enter a descriptive title (5-200 characters)"
                minLength={5}
                maxLength={200}
              />
              <small>{formData.title.length}/200 characters</small>
            </div>

            <div className="form-group">
              <label>Project Description *</label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                required 
                placeholder="Provide a detailed description of your idea (20-2000 characters)"
                minLength={20}
                maxLength={2000}
                rows={4}
              />
              <small>{formData.description.length}/2000 characters</small>
            </div>

            <div className="form-group">
              <label>Detailed Description (optional)</label>
              <textarea 
                name="detailedDescription" 
                value={formData.detailedDescription} 
                onChange={handleChange} 
                placeholder="Provide additional technical details, methodology, or background information"
                maxLength={10000}
                rows={6}
              />
              <small>{formData.detailedDescription.length}/10000 characters</small>
            </div>

            <div className="form-group">
              <label>Difficulty *</label>
              <select name="difficulty" value={formData.difficulty} onChange={handleChange} required>
                <option value="">Select Difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="form-group">
              <label>Category</label>
              <select name="category" value={formData.category} onChange={handleChange}>
                <option value="Research">Research</option>
                <option value="Development">Development</option>
                <option value="Innovation">Innovation</option>
                <option value="Improvement">Improvement</option>
                <option value="Analysis">Analysis</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Project Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="Not yet started">Not yet started</option>
                <option value="In progress">In progress</option>
                <option value="Collaboration needed">Collaboration needed</option>
                <option value="Completed">Completed</option>
                <option value="On hold">On hold</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tags (comma-separated)</label>
              <input 
                type="text" 
                name="tags" 
                value={formData.tags} 
                onChange={handleChange} 
                placeholder="e.g., Solar, Panel, Inverter, Renewable Energy"
              />
            </div>

            <div className="form-group">
              <label>Required Skills (comma-separated)</label>
              <input 
                type="text" 
                name="requiredSkills" 
                value={formData.requiredSkills} 
                onChange={handleChange} 
                placeholder="e.g., React, Node.js, Machine Learning, Python"
              />
            </div>

            <div className="form-group">
              <label>Estimated Duration</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="number" 
                  value={formData.estimatedDuration.value}
                  onChange={(e) => handleNestedChange('estimatedDuration', 'value', e.target.value)}
                  placeholder="Duration"
                  min="1"
                />
                <select 
                  value={formData.estimatedDuration.unit}
                  onChange={(e) => handleNestedChange('estimatedDuration', 'unit', e.target.value)}
                >
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Project Main Image (optional)</label>
              <input type="file" name="projectImage" accept="image/*" onChange={handleSingleFileChange} />
              <small style={{ color: '#666', fontSize: '12px' }}>
                Maximum file size: {formatFileSize(MAX_IMAGE_SIZE)}. Supported formats: JPG, PNG, GIF, WebP
              </small>
            </div>

            <div className="form-group">
              <label>Additional Images (optional, max 5)</label>
              <input type="file" name="additionalImages" accept="image/*" onChange={handleMultipleFileChange} multiple />
              <small style={{ color: '#666', fontSize: '12px' }}>
                Maximum 5 images, each up to {formatFileSize(MAX_IMAGE_SIZE)}. Supported formats: JPG, PNG, GIF, WebP
              </small>
            </div>

            <div className="form-group">
              <label>Research Paper/Documentation (PDF, optional)</label>
              <input type="file" name="projectPdf" accept="application/pdf" onChange={handleSingleFileChange} />
              <small style={{ color: '#666', fontSize: '12px' }}>
                Maximum file size: {formatFileSize(MAX_PDF_SIZE)}. Only PDF files are allowed
              </small>
            </div>

            <div className="form-group">
              <label>Related Links</label>
              {formData.relatedLinks.map((link, index) => (
                <div key={index} className="link-input-group" style={{ marginBottom: '10px', border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
                  <input
                    type="text"
                    placeholder="Link Title"
                    value={link.title}
                    onChange={(e) => handleLinkChange(index, 'title', e.target.value)}
                    style={{ marginBottom: '5px', width: '100%' }}
                  />
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={link.url}
                    onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                    style={{ marginBottom: '5px', width: '100%' }}
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={link.description}
                    onChange={(e) => handleLinkChange(index, 'description', e.target.value)}
                    style={{ marginBottom: '5px', width: '100%' }}
                  />
                  <select
                    value={link.type}
                    onChange={(e) => handleLinkChange(index, 'type', e.target.value)}
                    style={{ marginBottom: '5px', width: '100%' }}
                  >
                    <option value="website">Website</option>
                    <option value="github">GitHub</option>
                    <option value="paper">Research Paper</option>
                    <option value="video">Video</option>
                    <option value="documentation">Documentation</option>
                    <option value="other">Other</option>
                  </select>
                  {formData.relatedLinks.length > 1 && (
                    <button type="button" onClick={() => removeLinkField(index)} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px' }}>
                      Remove Link
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addLinkField} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px' }}>
                Add Link
              </button>
            </div>
          </div>

          <div className="form-section">
            <h3>Project Scope</h3>
            
            <div className="form-group">
              <label>Short-term Goals (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g., Research phase, Prototype development, Testing"
                value={formData.scope.shortTerm}
                onChange={(e) => handleNestedChange('scope', 'shortTerm', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Long-term Goals (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g., Commercial deployment, Patent filing, Market expansion"
                value={formData.scope.longTerm}
                onChange={(e) => handleNestedChange('scope', 'longTerm', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Limitations (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g., Budget constraints, Technical challenges, Time limitations"
                value={formData.scope.limitations}
                onChange={(e) => handleNestedChange('scope', 'limitations', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Assumptions (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g., Technology availability, Market demand, Resource access"
                value={formData.scope.assumptions}
                onChange={(e) => handleNestedChange('scope', 'assumptions', e.target.value)}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Future Enhancements</h3>
            {formData.futureEnhancements.map((enhancement, index) => (
              <div key={index} className="enhancement-group" style={{ marginBottom: '15px', border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
                <input
                  type="text"
                  placeholder="Enhancement Title"
                  value={enhancement.title}
                  onChange={(e) => handleEnhancementChange(index, 'title', e.target.value)}
                  style={{ marginBottom: '5px', width: '100%' }}
                />
                <textarea
                  placeholder="Enhancement Description"
                  value={enhancement.description}
                  onChange={(e) => handleEnhancementChange(index, 'description', e.target.value)}
                  style={{ marginBottom: '5px', width: '100%', minHeight: '60px' }}
                />
                <select
                  value={enhancement.priority}
                  onChange={(e) => handleEnhancementChange(index, 'priority', e.target.value)}
                  style={{ marginBottom: '5px', width: '100%' }}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
                {formData.futureEnhancements.length > 1 && (
                  <button type="button" onClick={() => removeEnhancementField(index)} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px' }}>
                    Remove Enhancement
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addEnhancementField} style={{ backgroundColor: '#17a2b8', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px' }}>
              Add Enhancement
            </button>
          </div>
          
          <div className="form-section">
            <h3>Author Info</h3>
            <div className="form-group">
              <label>Select Author *</label>
              <select name="selectedAuthorId" value={formData.selectedAuthorId} onChange={handleAuthorSelection} required>
                <option value="">Select an author</option>
                <option value="new">Add New Author</option>
                {Array.isArray(authors) && authors.map((author) => (
                  <option key={author._id} value={author._id}>
                    {author.authorName} ({author.authorEmail})
                  </option>
                ))}
              </select>
            </div>
            
            {formData.selectedAuthorId === "new" && (
              <>
                <div className="form-group">
                  <label>Author Name *</label>
                  <input 
                    type="text" 
                    name="authorName" 
                    value={formData.authorName} 
                    onChange={handleChange} 
                    required 
                    placeholder="Enter author's full name"
                  />
                </div>
                <div className="form-group">
                  <label>Author Email *</label>
                  <input 
                    type="email" 
                    name="authorEmail" 
                    value={formData.authorEmail} 
                    onChange={handleChange} 
                    required 
                    placeholder="author@example.com"
                  />
                </div>
                <div className="form-group">
                  <label>Author Phone (optional)</label>
                  <input 
                    type="tel" 
                    name="authorPhone" 
                    value={formData.authorPhone} 
                    onChange={handleChange} 
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div className="form-group">
                  <label>Author Photo (optional)</label>
                  <input 
                    type="file" 
                    name="authorPhoto" 
                    accept="image/*" 
                    onChange={handleSingleFileChange} 
                  />
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    Maximum file size: {formatFileSize(MAX_IMAGE_SIZE)}. If no photo is provided, a default author image will be used.
                  </small>
                </div>
                <div className="form-group">
                  <label>Social Media Link (optional)</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <select 
                      name="socialMediaType" 
                      value={formData.socialMediaType} 
                      onChange={handleChange}
                      style={{ width: '30%' }}
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="instagram">Instagram</option>
                      <option value="telegram">Telegram</option>
                      <option value="twitter">Twitter</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="facebook">Facebook</option>
                      <option value="youtube">YouTube</option>
                      <option value="other">Other</option>
                    </select>
                    <input 
                      type="url" 
                      name="socialMediaLink" 
                      value={formData.socialMediaLink} 
                      onChange={handleChange} 
                      placeholder="https://..."
                      style={{ width: '70%' }}
                    />
                  </div>
                  <small>Provide a social media link for easy contact (optional).</small>
                </div>
                <div className="form-group">
                  <label>Professional Details</label>
                  <textarea 
                    name="professionalDetails" 
                    value={formData.professionalDetails} 
                    onChange={handleChange}
                    placeholder="Brief bio, qualifications, or professional background"
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>

          <button type="submit" disabled={isSubmitting} style={{
            backgroundColor: isSubmitting ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            padding: '12px 30px',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            width: '100%',
            marginTop: '20px'
          }}>
            {isSubmitting ? "Submitting..." : "Submit Idea"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserForm;