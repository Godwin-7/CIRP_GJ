import React, { useState, useEffect } from "react";
import axios from "axios";
import "./UserForm.css"; // Import the custom CSS

const UserForm = () => {
  const [Domain, setDomain] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState({ type: "", message: "" });

  useEffect(() => {
    const fetchDomain = async () => {
      try {
        const domain = await axios.get("http://localhost:5000/domains");
        setDomain(domain.data);
      } catch (error) {
        console.error("Error fetching domains", error);
      }
    };
    fetchDomain();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormMessage({ type: "", message: "" });

    const formData = new FormData();
    formData.append("domainId", selectedDomain);
    formData.append("topic", topic);
    formData.append("description", description);
    formData.append("content", file);

    try {
      const response = await axios.post(
        "http://localhost:5000/addidea",
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
      setTopic("");
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
              {Domain.map((domains) => (
                <option key={domains._id} value={domains._id}>
                  {domains.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Topic</label>
            <input
              type="text"
              placeholder="Enter your idea's topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
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
      </div>
    </div>
  );
};

export default UserForm;
