/**
 * Home Page / Dashboard
 *
 * Main dashboard that displays role-based navigation and content.
 * Updated to use authService with dual-mode support.
 */

import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import News from "./News";
import ShowNews from "./ShowNews";
import "../assets/home.css";
import AdminDashboard from "./AdminDashboard";
import ReservationAdmin from "../components/ReservationAdmin";
import EvaluationAdmin from "../components/EvaluationAdmin";
import SubjectAdmin from "../components/SubjectAdmin";
import GradeSectionAdmin from "../components/GradeSectionAdmin";

const Home = () => {
  const navigate = useNavigate();
  const {
    user,
    role,
    isLoading: authLoading,
    clearAuth,
  } = useContext(AuthContext);

  const [currentSection, setCurrentSection] = useState("show-news");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /* PRESERVED FOR FUTURE USE - Backend token validation:
  const handleTokenExpiration = () => {
    setIsAuthenticated(false);
    setPermissions(null);
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    navigate("/");
  };

  useEffect(() => {
    const checkAuthAndFetchPermissions = async () => {
      try {
        const tokenValidationResponse = await fetch(`${config.backUrl}/api/users/validate-token`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (tokenValidationResponse.ok) {
          setIsAuthenticated(true);
          const roleResponse = await fetch(`${config.backUrl}/api/users/get-role`, {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          });
          const roleData = await roleResponse.json();
          if (roleResponse.ok) {
            setPermissions(roleData);
          } else {
            if (roleResponse.status === 401) {
              handleTokenExpiration();
            } else {
              setError("Failed to fetch role permissions. Please try again later.");
            }
          }
        } else {
          const errorData = await tokenValidationResponse.json();
          if (tokenValidationResponse.status === 401) {
            if (errorData.message === "El token ha expirado") {
              handleTokenExpiration();
            } else {
              setIsAuthenticated(false);
              setError(errorData.message || "Authentication failed. Please log in again.");
            }
          } else {
            setIsAuthenticated(false);
            setError(errorData.message || "An error occurred. Please try again later.");
          }
        }
      } catch (error) {
        console.error("Error validating token or fetching permissions:", error);
        setIsAuthenticated(false);
        setError("An unexpected error occurred. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchPermissions();
  }, [navigate]);
  */

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [authLoading, user, navigate]);

  // Logout function
  const onLogout = () => {
    /* PRESERVED FOR FUTURE USE:
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    */
    clearAuth();
    navigate("/");
  };

  // Render navigation links based on permissions
  const renderNavLinks = () => {
    if (!role) return null;

    const links = [];

    if (role.admin) {
      links.push(
        { href: "#show-news", text: "News" },
        { href: "#news", text: "Manage News" },
        { href: "#manageUsers", text: "Manage Users" },
        { href: "#manage-grades", text: "Manage Grades" },
        { href: "#manage-subjects", text: "Manage Subjects" },
        { href: "#manage-grade-sections", text: "Grade Sections" },
        { href: "#reservations", text: "Reservations" },
      );
    } else if (role.teacher) {
      links.push(
        { href: "#show-news", text: "News" },
        { href: "#news", text: "Manage News" },
        { href: "#manage-grades", text: "Manage Grades" },
        { href: "#reservations", text: "Reservations" },
      );
    } else if (role.parent) {
      links.push(
        { href: "#show-news", text: "News" },
        { href: "#notes", text: "My Grades" },
      );
    } else if (role.student) {
      links.push(
        { href: "#show-news", text: "News" },
        { href: "#notes", text: "My Grades" },
        { href: "#reservations", text: "Reservations" },
      );
    }

    const roleClass = role.admin
      ? "admin"
      : role.teacher
        ? "teacher"
        : role.parent
          ? "parent"
          : role.student
            ? "student"
            : "";

    return links.map((link, index) => (
      <a
        key={index}
        href={link.href}
        onClick={(e) => {
          e.preventDefault();
          setCurrentSection(link.href.slice(1));
          setIsMobileMenuOpen(false);
        }}
        data-role={roleClass}
        aria-current={
          currentSection === link.href.slice(1) ? "page" : undefined
        }
      >
        {link.text}
      </a>
    ));
  };

  // Render content for the selected section
  const renderContent = () => {
    switch (currentSection) {
      case "news":
        return (
          <div>
            <h2>News Management</h2>
            <News />
          </div>
        );
      case "show-news":
        return (
          <div>
            <h2>News</h2>
            <ShowNews />
          </div>
        );
      case "notes":
        return (
          <div>
            <EvaluationAdmin />
          </div>
        );
      case "manageUsers":
        return (
          <div>
            <h2>Manage Users</h2>
            <AdminDashboard />
          </div>
        );
      case "manageNews":
        return (
          <div>
            <h2>Manage News</h2>
            <p>Content for managing news.</p>
          </div>
        );
      case "manage-grades":
        return (
          <div>
            <h2>Manage Grades</h2>
            <EvaluationAdmin />
          </div>
        );
      case "manage-subjects":
        return (
          <div>
            <h2>Manage Subjects</h2>
            <SubjectAdmin />
          </div>
        );
      case "manage-grade-sections":
        return (
          <div>
            <h2>Manage Grade Sections</h2>
            <GradeSectionAdmin />
          </div>
        );
      case "reservations":
        return (
          <div>
            <h2>Reservations</h2>
            <ReservationAdmin />
          </div>
        );
      default:
        return <div>Select an option from the menu.</div>;
    }
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in.</div>;
  }

  return (
    <div className="container">
      <header className="header">
        <div className="school-name">School Name</div>
        <nav className={`nav ${isMobileMenuOpen ? "active" : ""}`}>
          {renderNavLinks()}
          <button onClick={onLogout} className="logout-button mobile-logout">
            Logout
          </button>
        </nav>
        <button
          className={`hamburger ${isMobileMenuOpen ? "active" : ""}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <button onClick={onLogout} className="logout-button desktop-logout">
          Logout
        </button>
      </header>

      <main className="content">{renderContent()}</main>
    </div>
  );
};

export default Home;
