import React, { useState, useEffect } from "react";
import axios from "axios";

const UserForm = () => {
  const [Domain, setDomain] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState({ type: "", message: "" });

  useEffect(() => {
    const fetchdomain = async () => {
      try {
        const domain = await axios.get("http://localhost:5000/domains");
        setDomain(domain.data);
      } catch (error) {
        console.error("Error fetching domains", error);
      }
    };
    fetchdomain();
  }, []);

  const handlesubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormMessage({ type: "", message: "" });

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
      setFormMessage({
        type: "success",
        message: "Your idea was submitted successfully!",
      });
      setSelectedDomain("");
      setTopic("");
      setDescription("");
      setFile(null);
    } catch (err) {
      console.log(err);
      setFormMessage({
        type: "error",
        message: "There was an error submitting your idea. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{ backgroundColor: "#001f3f" }}
      className="w-full min-h-screen overflow-y-hidden flex items-center justify-center scrollbar-hide"
    >
      <div className="w-full max-w-4xl overflow-y-hidden px-4 py-8 rounded-xl shadow-lg border border-gray-100 scrollbar-hide">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Submit Your Idea
          </h2>
          <p className="text-gray-200 text-sm">
            Share your innovative concept with our community
          </p>
        </div>

        {formMessage.message && (
          <div
            className={`mb-6 p-4 rounded-md ${
              formMessage.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {formMessage.message}
          </div>
        )}

        <form onSubmit={handlesubmit} className="space-y-5justify-center">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Domain Area
            </label>
            <div className="relative">
              <select
                className="w-full text-black pl-3 pr-10 py-3 text-base bg-gray-50 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                onChange={(e) => setSelectedDomain(e.target.value)}
                value={selectedDomain}
                required
              >
                <option value="" className="text-black">
                  Select a Domain
                </option>
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
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Topic
            </label>
            <input
              type="text"
              placeholder="Enter your idea's topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              className="w-full text-black px-3 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Description
            </label>
            <textarea
              placeholder="Describe your idea in detail"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows="4"
              className="w-full text-black px-3 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Supporting Document
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition duration-150">
                <div className="flex flex-col items-center justify-center pt-7">
                  <svg
                    className="w-10 h-10 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    ></path>
                  </svg>
                  <p className="pt-1 text-sm text-gray-500">
                    {file ? file.name : "Upload a PDF document"}
                  </p>
                </div>
                <input
                  type="file"
                  className="opacity-0"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  required
                />
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Only PDF files are accepted
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                "Submit Idea"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
