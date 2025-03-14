import React from "react";
import { useState, useEffect } from "react";
import axios from "axios";
const UserForm = () => {
  const [Domain, setDomain] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const fetchdomain = async () => {
    const domain = await axios.get("http://localhost:5000/domains");
    setDomain(domain.data);
  };
  useEffect(() => {
    fetchdomain();
  }, []);

  const handlesubmit = async (e) => {
    e.preventDefault();
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
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      <form onSubmit={handlesubmit}>
        <label htmlFor="">Choose a domain:</label>
        <select onChange={(e) => setSelectedDomain(e.target.value)} required>
          <option value="">Select a Domain</option>
          {Domain.map((domains) => (
            <option
              key={domains._id}
              value={domains._id}
              className="text-black"
            >
              {domains.title}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
          required
        />
        <button type="submit">Submit Idea</button>
      </form>
    </>
  );
};

export default UserForm;
