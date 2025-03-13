import React from "react";
import axios from "axios";
import { useState, useEffect } from "react";

const DomainAdder = () => {
  const [formData, setFormData] = useState({
    title: "",
    imageurl: "",
    description: "",
    topics: "easy",
  });
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:5000/domainform",
        formData
      );
      console.log("data entered successfully", response);
    } catch {
      console.log("error sending data");
    }
  };
  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="p-4 max-w-md mx-auto shadow-lg rounded-lg"
      >
        <label className="block mb-2">Title:</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="w-full p-2 mb-4 border rounded"
        />

        <label className="block mb-2">Image URL:</label>
        <input
          type="text"
          name="imageurl"
          value={formData.imageurl}
          onChange={handleChange}
          required
          className="w-full p-2 mb-4 border rounded"
        />

        <label className="block mb-2">Description:</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          className="w-full p-2 mb-4 border rounded"
        />

        <label className="block mb-2">Topics:</label>
        <select
          name="topics"
          value={formData.topics}
          onChange={handleChange}
          required
          className="w-full p-2 mb-4 border rounded"
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded w-full"
        >
          Submit
        </button>
      </form>
    </>
  );
};

export default DomainAdder;
