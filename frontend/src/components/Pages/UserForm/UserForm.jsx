import React, { useState, useEffect } from "react";
import axios from "axios";
import "./UserForm.css";
import AuthorApp from "../../Author";

const UserForm = () => {
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [title, setTitle] = useState(""); // Changed from 'topic'
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState({ type: "", message: "" });

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        // ✅ Updated endpoint for fetching domains
        const response = await axios.get("http://localhost:5000/api/domains");
        setDomains(response.data);
      } catch (error) {
        console.error("Error fetching domains", error);
      }
    };
    fetchDomains();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormMessage({ type: "", message: "" });

    const formData = new FormData();
    formData.append("domainId", selectedDomain);
    formData.append("title", title); // Changed from 'topic'
    formData.append("description", description);
    formData.append("projectPdf", file); // Changed from 'content'

    try {
      // ✅ Updated endpoint for submitting an idea
      const response = await axios.post(
        "http://localhost:5000/api/ideas/create",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      console.log(response.data);
      setFormMessage({
        type: "success",
        message: "Your idea was submitted successfully!",
      });
      setSelectedDomain("");
      setTitle(""); // Changed from 'topic'
      setDescription("");
      setFile(null);
    } catch (err) {
      console.log(err);
      setFormMessage({
        type: "error",
        message: "There was an error submitting your idea. Please try again.",
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
          <div
            className={`error-message ${
              formMessage.type === "success" ? "success" : "error"
            }`}
          >
            {formMessage.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Domain Area</label>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              required
            >
              <option value="">Select a Domain</option>
              {domains.map((domain) => (
                <option key={domain._id} value={domain._id}>
                  {domain.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Title</label> {/* Changed from 'Topic' */}
            <input
              type="text"
              placeholder="Enter your idea's title" // Updated placeholder
              value={title} // Changed from 'topic'
              onChange={(e) => setTitle(e.target.value)} // Changed from 'setTopic'
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              placeholder="Describe your idea in detail"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Supporting Document (PDF only)</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files[0])}
              required
            />
          </div>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Idea"}
          </button>
        </form>
        <AuthorApp />
      </div>
    </div>
  );
};

export default UserForm;