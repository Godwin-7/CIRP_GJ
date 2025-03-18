import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Pages/HomePage/Home/Home";
import AboutUs from "./components/Pages/HomePage/AboutUs/AboutUs";
import TextShpere from "./components/Pages/HomePage/TextShpere/TextShpere";
import Ideas from "./components/Pages/HomePage/Ideas/Ideas";
import ContactForm from "./components/Pages/HomePage/ContactForm/ContactForm";
import DevelopersSection from "./components/Pages/HomePage/Developers/Developers";
import Navbar from "./components/Pages/HomePage/navbar/navbar";
import Footer from "./components/Pages/HomePage/Footer/Footer";
import DomainPage from "./components/Pages/DomainPage/DomainPage";
import TitlePage from "./components/Pages/TitlePage/TitlePage";
import ProjectPage from "./components/Pages/ProjectPage/ProjectPage";
import DomainAdder from "./components/Pages/DomainPage/DomainAdder";
import UserForm from "./components/Pages/UserForm/UserForm";
import Login from "./components/Login";
import Register from "./components/Register";
import Chat from "./components/Pages/ChatPage/Chat";
import Chatbot from "./components/Pages/HomePage/Chatbot/Chatbot";
import ChatbotPage from "./components/Pages/HomePage/Chatbot/ChatbotPage";
function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <Home />
              <AboutUs />
              <Ideas />
              <TextShpere />
              <ContactForm />
              <DevelopersSection />
              <Chatbot />
              <Footer />
            </>
          }
        />
        <Route path="/domains" element={<DomainPage />} />
        <Route path="/domains/:title/:domainId" element={<TitlePage />} />
        <Route
          path="/domains/:domainId/ideas/:ideaId"
          element={<ProjectPage />}
        />
        <Route path="/domainform" element={<DomainAdder />} />
        <Route path="/addidea" element={<UserForm />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/chatbot" element={<ChatbotPage />} />
      </Routes>
    </Router>
  );
}

export default App;
