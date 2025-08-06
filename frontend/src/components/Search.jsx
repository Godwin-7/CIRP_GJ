// Search.jsx
import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Search.css";

const Search = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:5000/api/search?q=${query}`);
      setResults(response.data);
    } catch (err) {
      console.error("Error during search:", err);
      setError("Failed to perform search. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="search-page">
      <h1>Search Projects and Domains</h1>
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for titles, descriptions, or topics..."
          className="search-input"
        />
        <button type="submit" className="search-button">
          Search
        </button>
      </form>

      {isLoading && <p>Loading search results...</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="search-results">
        {results.length > 0 ? (
          results.map((result) => (
            <div key={result._id} className="search-result-card">
              <h3>{result.title}</h3>
              <p>{result.description}</p>
              {/* Assuming the result object has a linkTo property */}
              <Link to={`/domains/${result.domainId}/ideas/${result._id}`} className="view-link">
                View Project
              </Link>
            </div>
          ))
        ) : (
          !isLoading && query.trim() && <p>No results found for "{query}".</p>
        )}
      </div>
    </div>
  );
};

export default Search;