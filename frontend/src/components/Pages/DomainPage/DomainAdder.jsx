import React, { useState } from "react";
import axios from "axios";
import "./DomainAdder.css"; // Import the custom CSS

const DomainAdder = () => {
  const [formData, setFormData] = useState({
    title: "",
    image: null,
    description: "",
    topics: {
      easy: [],
      medium: [],
      hard: [],
    },
  });

  const handleChange = (e) => {
    const { name, value, dataset } = e.target;

    if (name === "topics") {
      const difficulty = dataset.difficulty;
      setFormData((prev) => ({
        ...prev,
        topics: {
          ...prev.topics,
          [difficulty]: value
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item),
        },
      }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
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
    formDataToSend.append("topics", JSON.stringify(formData.topics)); // ✅ No change to how topics are sent

    try {
      const response = await axios.post(
        "http://localhost:5000/domainform", // ✅ Keeping your route intact
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      console.log("Data entered successfully", response);
    } catch (error) {
      console.log("Error sending data", error);
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
            name="topics"
            data-difficulty="easy"
            value={formData.topics.easy.join(", ")}
            onChange={handleChange}
            placeholder="e.g., HTML, CSS"
          />
        </div>

        <div className="form-group">
          <label>Medium Topics (comma-separated)</label>
          <input
            type="text"
            name="topics"
            data-difficulty="medium"
            value={formData.topics.medium.join(", ")}
            onChange={handleChange}
            placeholder="e.g., React, Node.js"
          />
        </div>

        <div className="form-group">
          <label>Hard Topics (comma-separated)</label>
          <input
            type="text"
            name="topics"
            data-difficulty="hard"
            value={formData.topics.hard.join(", ")}
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
