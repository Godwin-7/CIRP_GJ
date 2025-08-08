// UserForm.jsx
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
    difficulty: "",
    category: "",
    tags: "",
    requiredSkills: "",
    domainId: "",
    projectImage: null,
    additionalImages: [],
    projectPdf: null,
    relatedLinks: [{ url: "" }],
    selectedAuthorId: "",
    authorName: "",
    authorEmail: "",
    professionalDetails: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState({ type: "", message: "" });

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
  };

  const handleAuthorSelection = (e) => {
    const selectedAuthorId = e.target.value;
    setFormData({ ...formData, selectedAuthorId });
  };

  const handleLinkChange = (index, e) => {
    const newLinks = [...formData.relatedLinks];
    newLinks[index][e.target.name] = e.target.value;
    setFormData({ ...formData, relatedLinks: newLinks });
  };

  const addLinkField = () => {
    setFormData({
      ...formData,
      relatedLinks: [...formData.relatedLinks, { url: "" }],
    });
  };

  const removeLinkField = (index) => {
    const newLinks = formData.relatedLinks.filter((_, i) => i !== index);
    setFormData({ ...formData, relatedLinks: newLinks });
  };

  const handleSingleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData({ ...formData, [name]: files[0] });
  };

  const handleMultipleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData({ ...formData, [name]: files });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormMessage({ type: "", message: "" });

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required. Please log in.");
      }

      let authorId;
      if (formData.selectedAuthorId === "new") {
        const authorResponse = await axios.post("http://localhost:5000/api/authors", {
          authorName: formData.authorName,
          authorEmail: formData.authorEmail,
          bio: formData.professionalDetails,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        
        // Handle different response formats
        if (authorResponse.data.data && authorResponse.data.data.author) {
          authorId = authorResponse.data.data.author._id;
        } else if (authorResponse.data._id) {
          authorId = authorResponse.data._id;
        } else {
          throw new Error("Failed to create author");
        }
      } else {
        authorId = formData.selectedAuthorId;
      }

      const formDataToSend = new FormData();
      formDataToSend.append("domainId", formData.domainId);
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("authorId", authorId);
      formDataToSend.append("difficulty", formData.difficulty);
      formDataToSend.append("category", formData.category);
      
      // Process tags and skills as JSON arrays
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      const skillsArray = formData.requiredSkills.split(',').map(skill => ({ skill: skill.trim(), level: 'intermediate' })).filter(skill => skill.skill);
      
      formDataToSend.append("tags", JSON.stringify(tagsArray));
      formDataToSend.append("requiredSkills", JSON.stringify(skillsArray));
      
      if (formData.projectImage) {
        formDataToSend.append("projectImage", formData.projectImage);
      }
      if (formData.projectPdf) {
        formDataToSend.append("projectPdf", formData.projectPdf);
      }
      if (formData.additionalImages && formData.additionalImages.length > 0) {
        for (const file of formData.additionalImages) {
          formDataToSend.append("additionalImages", file);
        }
      }

      // Process related links
      const validLinks = formData.relatedLinks.filter(link => link.url.trim());
      formDataToSend.append("relatedLinks", JSON.stringify(validLinks));

      const response = await axios.post("http://localhost:5000/api/ideas", formDataToSend, {
        headers: { 
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        },
      });

      setFormMessage({ type: "success", message: "Your idea was submitted successfully!" });
      setTimeout(() => {
        navigate(`/domains/${formData.domainId}`);
      }, 2000);

    } catch (err) {
      console.error("Error submitting form", err);
      let errorMessage = "There was an error submitting your idea. ";
      
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage += err.response.data.message;
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
              <label>Domain Area</label>
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
              <label>Project Title</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Project Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Difficulty</label>
              <select name="difficulty" value={formData.difficulty} onChange={handleChange} required>
                <option value="">Select Difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="form-group">
              <label>Category</label>
              <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="e.g., Renewable Energy" />
            </div>
            <div className="form-group">
              <label>Tags (comma-separated)</label>
              <input type="text" name="tags" value={formData.tags} onChange={handleChange} placeholder="e.g., Solar, Panel, Inverter" />
            </div>
            <div className="form-group">
              <label>Required Skills (comma-separated)</label>
              <input type="text" name="requiredSkills" value={formData.requiredSkills} onChange={handleChange} placeholder="e.g., React, Node.js" />
            </div>
            <div className="form-group">
              <label>Project Main Image (optional)</label>
              <input type="file" name="projectImage" accept="image/*" onChange={handleSingleFileChange} />
            </div>
            <div className="form-group">
              <label>Additional Images (optional)</label>
              <input type="file" name="additionalImages" accept="image/*" onChange={handleMultipleFileChange} multiple />
            </div>
            <div className="form-group">
              <label>Research Paper (optional)</label>
              <input type="file" name="projectPdf" accept="application/pdf" onChange={handleSingleFileChange} />
            </div>
            <div className="form-group">
              <label>Related Links</label>
              {formData.relatedLinks.map((link, index) => (
                <div key={index} className="link-input-group">
                  <input
                    type="text"
                    name="url"
                    value={link.url}
                    onChange={(e) => handleLinkChange(index, e)}
                    placeholder="e.g., https://example.com"
                  />
                  {formData.relatedLinks.length > 1 && (
                    <button type="button" onClick={() => removeLinkField(index)}>-</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addLinkField}>
                Add Link
              </button>
            </div>
          </div>
          
          <div className="form-section">
            <h3>Author Info</h3>
            <div className="form-group">
              <label>Select Author</label>
              <select name="selectedAuthorId" value={formData.selectedAuthorId} onChange={handleAuthorSelection} required>
                <option value="">Select an author</option>
                <option value="new">Add New Author</option>
                {Array.isArray(authors) && authors.map((author) => (
                  <option key={author._id} value={author._id}>
                    {author.authorName}
                  </option>
                ))}
              </select>
            </div>
            {formData.selectedAuthorId === "new" && (
              <>
                <div className="form-group">
                  <label>Author Name</label>
                  <input type="text" name="authorName" value={formData.authorName} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Author Email</label>
                  <input type="email" name="authorEmail" value={formData.authorEmail} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Professional Details</label>
                  <textarea name="professionalDetails" value={formData.professionalDetails} onChange={handleChange} />
                </div>
              </>
            )}
          </div>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Idea"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserForm;