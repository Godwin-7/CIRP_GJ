// DomainAdder.jsx
import React, { useState } from "react";
import axios from "axios";
import "./DomainAdder.css";

const DomainAdder = () => {
  const [formData, setFormData] = useState({
    title: "",
    image: null,
    description: "",
    easyTopics: "",
    mediumTopics: "",
    hardTopics: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, image: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    formDataToSend.append("title", formData.title);
    formDataToSend.append("image", formData.image);
    formDataToSend.append("description", formData.description);

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
    formDataToSend.append("topics", JSON.stringify(topics));

    try {
      const response = await axios.post(
        "http://localhost:5000/api/domains/create",
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      console.log("Data entered successfully", response.data);
      alert("Domain added successfully!");
    } catch (error) {
      console.error("Error sending data", error);
      alert("Failed to add domain.");
    }
  };

  return (
    <div className="add-domain-page">
      <h1>Add a New Domain</h1>
      <form onSubmit={handleSubmit} className="add-domain-form">
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="Enter domain title"
          />
        </div>

        <div className="form-group">
          <label>Image</label>
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleFileChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
            placeholder="Enter domain description"
          ></textarea>
        </div>

        <div className="form-group">
          <label>Easy Topics (comma-separated)</label>
          <input
            type="text"
            name="easyTopics"
            value={formData.easyTopics}
            onChange={handleChange}
            placeholder="e.g., HTML, CSS"
          />
        </div>

        <div className="form-group">
          <label>Medium Topics (comma-separated)</label>
          <input
            type="text"
            name="mediumTopics"
            value={formData.mediumTopics}
            onChange={handleChange}
            placeholder="e.g., React, Node.js"
          />
        </div>

        <div className="form-group">
          <label>Hard Topics (comma-separated)</label>
          <input
            type="text"
            name="hardTopics"
            value={formData.hardTopics}
            onChange={handleChange}
            placeholder="e.g., MongoDB, AWS"
          />
        </div>

        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default DomainAdder;