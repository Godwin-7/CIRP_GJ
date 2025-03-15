import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

const ProjectPage = () => {
  const { domainId, ideaId } = useParams();
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:5000/domains/${domainId}/ideas/${ideaId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch the data");
        }
        return res.json();
      })
      .then((data) => {
        setIdea(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Unable to fetch the data", err);
        setError(err);
        setLoading(false);
      });
  }, [domainId, ideaId]);

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gray-900 flex items-center justify-center text-white p-8">
        <div className="bg-red-500 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-2">Error Loading Project</h2>
          <p>Unable to load project data. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-900 text-white p-4 md:p-8">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-12  bg-gray-800 rounded-lg shadow-lg p-90">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl md:text-3xl font-bold">
                {loading ? "Loading..." : idea?.topic || "Untitled Project"}
              </h1>
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="bg-white text-gray-900 rounded-lg shadow-lg p-6 h-full">
              <h2 className="text-xl font-semibold mb-4 border-b pb-2">
                Project Details
              </h2>

              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-700">Description</h3>
                    <p className="mt-1">
                      {idea?.description || "No description available."}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-700">Created By</h3>
                    <p className="mt-1">{idea?.author || "Unknown"}</p>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-700">Date</h3>
                    <p className="mt-1">
                      {idea?.submittedAt
                        ? new Date(idea.submittedAt).toLocaleDateString()
                        : "Unknown date"}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-700">Status</h3>
                    <span className="inline-block mt-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                      {idea?.status || "In Progress"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="lg:col-span-8">
            <div className="bg-white text-gray-900 rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Document</h2>
              </div>

              <div className="flex-grow">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                  </div>
                ) : idea?.content ? (
                  <div className="h-full">
                    <iframe
                      src={`http://localhost:5000/uploads/${idea.content
                        .split("\\")
                        .pop()}#toolbar=0&view=FitH`}
                      className="w-full h-96 lg:h-[500px]"
                      title="Project Document"
                    ></iframe>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 bg-gray-50">
                    <p className="text-gray-500">No document available</p>
                  </div>
                )}
              </div>

              {idea?.content && (
                <div className="p-4 bg-gray-100 text-center">
                  <a
                    href={`http://localhost:5000/uploads/${idea.content
                      .split("\\")
                      .pop()}`}
                    download
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download Full Document
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectPage;
