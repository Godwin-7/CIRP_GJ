import React, { useState } from "react";
import axios from "axios";

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
    if (e.target.name === "topics") {
      const { value, dataset } = e.target;
      const difficulty = dataset.difficulty;
      setFormData({
        ...formData,
        topics: {
          ...formData.topics,
          [difficulty]: value.split(",").map((item) => item.trim()),
        },
      });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
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
    formDataToSend.append("topics", JSON.stringify(formData.topics));

    try {
      const response = await axios.post(
        "http://localhost:5000/domainform",
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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center py-[12vh] px-[10vh] sm:px-4 lg:px-5">
      <div className="max-w-3xl w-[90vh] p-[10vh] rounded-xl shadow-2xl overflow-hidden">
        <h2 className="text-3xl font-semibold text-black text-center mb-8 tracking-wide">
          Add a New Domain
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label
              htmlFor="title"
              className="block text-sm text-black font-medium"
            >
              Title
            </label>
            <input
              type="text"
              name="title"
              id="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="mt-1 block w-full text-black rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3"
              placeholder="Enter domain title"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="image"
              className="block text-sm text-black font-medium text-gray-700"
            >
              Image
            </label>
            <input
              type="file"
              name="image"
              id="image"
              accept="image/*"
              onChange={handleFileChange}
              required
              className="mt-1 text-black block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-700"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              name="description"
              id="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              className="mt-1 text-black block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3"
              placeholder="Enter domain description"
            ></textarea>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="easy-topics"
              className="block text-sm font-medium text-gray-700"
            >
              Easy Topics
            </label>
            <input
              type="text"
              name="topics"
              id="easy-topics"
              data-difficulty="easy"
              value={formData.topics.easy.join(", ")}
              onChange={handleChange}
              placeholder="Comma-separated topics"
              className="mt-1 block text-black w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="medium-topics"
              className="block text-sm font-medium text-gray-700"
            >
              Medium Topics
            </label>
            <input
              type="text"
              name="topics"
              id="medium-topics"
              data-difficulty="medium"
              value={formData.topics.medium.join(", ")}
              onChange={handleChange}
              placeholder="Comma-separated topics"
              className="mt-1 text-black block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="hard-topics"
              className="block text-sm font-medium text-gray-700"
            >
              Hard Topics
            </label>
            <input
              type="text"
              name="topics"
              id="hard-topics"
              data-difficulty="hard"
              value={formData.topics.hard.join(", ")}
              onChange={handleChange}
              placeholder="Comma-separated topics"
              className="mt-1 block  text-black w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DomainAdder;
