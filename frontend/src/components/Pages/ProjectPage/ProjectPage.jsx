import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

const ProjectPage = () => {
  const { domainId, ideaId } = useParams();
  const [idea, setIdea] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/domains/${domainId}/ideas/${ideaId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch the data");
        }
        return res.json();
      })
      .then((data) => {
        setIdea(data);
      })
      .catch(() => {
        console.error("Unable to fetch the data");
      });
  }, [domainId, ideaId]);

  return (
    <div className="min-h-screen w-full bg-gray-900 text-white p-8">
      <div className="container mx-auto bg-white text-gray-900 p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-4">
          {idea?.topic || "Loading..."}
        </h1>
        <p className="text-lg mb-6">
          {idea?.description || "No description available."}
        </p>
        <h2 className="text-2xl font-semibold mb-4">Document</h2>
        {idea?.content ? (
          <div className="border rounded-lg overflow-hidden shadow-md">
            <iframe
              src={`http://localhost:5000/uploads/${idea.content
                .split("\\")
                .pop()}#toolbar=0&view=FitH`}
              className="w-full h-[400px]"
            ></iframe>
            <div className="p-4 bg-gray-200 text-center">
              <a
                href={`http://localhost:5000/uploads/${idea.content
                  .split("\\")
                  .pop()}`}
                download
                className="text-blue-600 font-semibold hover:underline"
              >
                Download Full Document
              </a>
            </div>
          </div>
        ) : (
          <p>No document available.</p>
        )}
      </div>
    </div>
  );
};

export default ProjectPage;
