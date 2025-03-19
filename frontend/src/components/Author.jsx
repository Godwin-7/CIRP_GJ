import { useState, useEffect } from "react";
import axios from "axios";

const AuthorApp = () => {
  const [formData, setFormData] = useState({
    authorName: "",
    authorEmail: "",
    topic: "", // ✅ Added new field
    bio: "",
  });

  const [authors, setAuthors] = useState([]);

  // ✅ Handle Form Input Changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/addauthor", formData);
      alert("Author added successfully!");
      fetchAuthors();
      setFormData({ authorName: "", authorEmail: "", topic: "", bio: "" }); // ✅ Reset topic field
    } catch (error) {
      console.error("Error adding author:", error);
      alert("Failed to add author");
    }
  };

  // ✅ Fetch Authors
  const fetchAuthors = async () => {
    try {
      const res = await axios.get("http://localhost:5000/authors");
      setAuthors(res.data);
    } catch (error) {
      console.error("Error fetching authors:", error);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Author Management</h2>
        <form
          onSubmit={handleSubmit}
          className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8"
        >
          <h3 className="text-xl font-bold mb-4">Add Author</h3>

          {/* ✅ Author Name */}
          <div className="mb-4">
            <label className="block">Author Name</label>
            <input
              type="text"
              name="authorName"
              value={formData.authorName}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-700 text-white"
              required
            />
          </div>

          {/* ✅ Author Email */}
          <div className="mb-4">
            <label className="block">Author Email</label>
            <input
              type="email"
              name="authorEmail"
              value={formData.authorEmail}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-700 text-white"
              required
            />
          </div>

          {/* ✅ Topic Field */}
          <div className="mb-4">
            <label className="block">Topic</label>
            <input
              type="text"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-700 text-white"
              required
            />
          </div>

          {/* ✅ Bio Field */}
          <div className="mb-4">
            <label className="block">Bio (Optional)</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition"
          >
            Add Author
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthorApp;
