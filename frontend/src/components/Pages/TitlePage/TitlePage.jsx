import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const TitlePage = () => {
  const { title, domainId } = useParams();
  const [domain, setDomain] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const handleproject = (ideaId) => {
    navigate(`/domains/${domainId}/ideas/${ideaId}`);
  };

  useEffect(() => {
    setIsLoading(true);
    fetch(`http://localhost:5000/domains/${domainId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch domain data");
        }
        return res.json();
      })
      .then((data) => {
        setDomain(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching domain:", err);
        setError(err.message);
        setIsLoading(false);
      });
  }, [domainId]);

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen w-full"
        style={{ backgroundColor: "#001f3f" }}
      >
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-t-white border-b-gray-300 border-l-gray-300 border-r-gray-300 rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-white">Loading domain details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center min-h-screen w-full"
        style={{ backgroundColor: "#001f3f" }}
      >
        <div className="p-6 bg-white rounded-lg shadow-lg border border-red-200 max-w-md w-full">
          <div className="flex items-center text-red-600 mb-4">
            <svg
              className="w-8 h-8 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-xl font-semibold">Error Loading Domain</h2>
          </div>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 text-white rounded-md transition-colors"
            style={{ backgroundColor: "#001f3f" }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!domain) return null;

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#001f3f" }}>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8 w-full">
          <div className="relative">
            {domain.imageurl ? (
              <div className="h-64 sm:h-80 md:h-96 w-full overflow-hidden">
                <img
                  src={`http://localhost:5000${domain.imageurl}`}
                  alt={domain.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
            ) : (
              <div className="h-32 sm:h-48 bg-gradient-to-r from-gray-700 to-gray-900"></div>
            )}

            <div
              className={`px-6 py-6 ${
                domain.imageurl ? "absolute bottom-0 text-white w-full" : ""
              }`}
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
                {domain.title}
              </h1>
            </div>
          </div>

          <div className="px-6 py-6">
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-4">
              {domain.description}
            </p>
          </div>
        </div>
        <div className="bg-white shadow-md rounded-lg overflow-hidden w-full">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
              Ideas
            </h2>
          </div>

          {domain.ideas.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {domain.ideas.map((idea, index) => (
                <li
                  key={index}
                  className="px-6 py-5 hover:bg-gray-50 transition-colors cursor-pointer hover:bg-sky-300"
                >
                  <h3
                    className="text-lg md:text-xl font-medium text-gray-900"
                    onClick={() => handleproject(idea._id)}
                  >
                    {idea.topic}
                  </h3>
                  <p className="mt-2 text-gray-600">{idea.description}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-6 py-8">
              <p className="text-gray-500">
                No topics available for this domain yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TitlePage;
