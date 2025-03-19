import { useState, useEffect } from "react";
import axios from "axios";

const AuthorApp = () => {
  const [formData, setFormData] = useState({
    authorName: "",
    authorEmail: "",
    topic: "",
    bio: "",
  });

  const [authors, setAuthors] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Handle Form Input Changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/authors/${editingId}`, formData);
        alert("Author updated successfully!");
        setEditingId(null);
      } else {
        await axios.post("http://localhost:5000/addauthor", formData);
        alert("Author added successfully!");
      }
      fetchAuthors();
      setFormData({ authorName: "", authorEmail: "", topic: "", bio: "" });
    } catch (error) {
      console.error("Error with author:", error);
      alert(editingId ? "Failed to update author" : "Failed to add author");
    }
  };

  // Fetch Authors
  const fetchAuthors = async () => {
    try {
      const res = await axios.get("http://localhost:5000/authors");
      setAuthors(res.data);
    } catch (error) {
      console.error("Error fetching authors:", error);
    }
  };

  // Handle Edit
  const handleEdit = (author) => {
    setFormData({
      authorName: author.authorName,
      authorEmail: author.authorEmail,
      topic: author.topic,
      bio: author.bio || "",
    });
    setEditingId(author._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle Delete
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this author?")) {
      try {
        await axios.delete(`http://localhost:5000/authors/${id}`);
        alert("Author deleted successfully!");
        fetchAuthors();
      } catch (error) {
        console.error("Error deleting author:", error);
        alert("Failed to delete author");
      }
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, []);

  return (
    <div className="author-container">
      <h2>Author Management</h2>
      <div className="author-form">
        <h3>{editingId ? "Edit Author" : "Add Author"}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="authorName">Author Name</label>
            <input
              type="text"
              id="authorName"
              name="authorName"
              value={formData.authorName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="authorEmail">Author Email</label>
            <input
              type="email"
              id="authorEmail"
              name="authorEmail"
              value={formData.authorEmail}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="topic">Topic</label>
            <input
              type="text"
              id="topic"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio (Optional)</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
            />
          </div>

          <button type="submit">
            {editingId ? "Update Author" : "Add Author"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setFormData({ authorName: "", authorEmail: "", topic: "", bio: "" });
              }}
              className="edit-button"
              style={{ marginTop: "10px" }}
            >
              Cancel Edit
            </button>
          )}
        </form>
      </div>

      <div className="author-list">
        <h3>Authors List</h3>
        {authors.length > 0 ? (
          authors.map((author) => (
            <div key={author._id} className="author-item">
              <div className="author-item-info">
                <h4>{author.authorName}</h4>
                <p>{author.authorEmail}</p>
                <span className="topic">{author.topic}</span>
                {author.bio && <p>{author.bio}</p>}
              </div>
              <div className="author-item-actions">
                <button
                  onClick={() => handleEdit(author)}
                  className="edit-button"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(author._id)}
                  className="delete-button"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-authors">No authors found. Add your first author!</div>
        )}
      </div>
    </div>
  );
};

export default AuthorApp;