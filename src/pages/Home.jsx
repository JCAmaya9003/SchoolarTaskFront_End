import React, { useEffect, useState, useContext } from "react";
import { config } from "../utils/ConfigUtils";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import News from "./News";
import ShowNews from "./ShowNews";
import '../assets/home.css';
import {jwtDecode} from "jwt-decode"
import AdminDashboard from "./AdminDashboard";
import ReservationAdmin from "../components/ReservationAdmin";


const Home = () => {
 
  const navigate = useNavigate();

  const [permissions, setPermissions] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState("show-News");
  const [error, setError] = useState(null);
  const { clearAuth } = useContext(AuthContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


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
            console.log(roleData);
            setPermissions(roleData);
            console.log(permissions);
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
  }, [URL, navigate]);

  // Logout function
  const onLogout = () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setIsAuthenticated(false);
    setPermissions(null);
    clearAuth();
    navigate("/");
  };

  // Render navigation links based on permissions
  const renderNavLinks = () => {
    if (!permissions) return null;

    const role = permissions.admin ? 'admin' : 
                 permissions.teacher ? 'teacher' : 
                 permissions.parent ? 'parent' : 
                 permissions.student ? 'student' : '';

    const links = [];

    if (permissions.admin) {

      links.push(
        { href: "#show-news", text: "Noticias" },
        { href: "#news", text: "Gestionar Noticias" },
        { href: "#manageUsers", text: "Gestionar Usuarios" },
      );
      
    } else if (permissions.teacher) {
      links.push(
        { href: "#show-news", text: "Noticias" },
        { href: "#manage-grades", text: "Gestionar Notas" },
        { href: "#reservations", text: "Reservas" }
      );
    } else if (permissions.parent || permissions.student) {
      links.push(
        { href: "#show-news", text: "Noticias" },
        { href: "#notes", text: "Notas Hijos" }
      );
    }

    return links.map((link, index) => (
      <a
        key={index}
        href={link.href}
        onClick={(e) => {
          e.preventDefault();
          setCurrentSection(link.href.slice(1));
          setIsMobileMenuOpen(false);
        }}
        data-role={role}
        aria-current={currentSection === link.href.slice(1) ? "page" : undefined}
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
            <h2> Gestion de Noticias</h2>
          
            <News/>

          </div>
        );
      case "show-news":
        return (
          <div>
            <h2>Mostrar Noticias</h2>
            <ShowNews/>
          </div>
        );
      case "notes":
        return (
          <div>
            <img src="/path/to/notes-image.png" alt="Notes Section" />
            <h2>Notas</h2>
            <p>Contenido de notas.</p>
            
          </div>
        );
      case "manageUsers":
        return (
          <div>
            <h2>Gestionar Usuarios</h2>
            <AdminDashboard/>
            
          </div>
        );
      case "manageNews":
        return (
          <div>
            <h2>Gestionar Noticias</h2>
            <p>Contenido para gestionar noticias.</p>
          </div>
        );
      case "manageGrades":
        return (
          <div>
            <h2>Gestionar Notas</h2>
            <p>Contenido para gestionar notas.</p>
          </div>
        );
      case "reservations":
        return (
          <div>
            <h2>Reservas</h2>
            <ReservationAdmin />
          </div>
        );
      default:
        return <div>Selecciona una opción del menú.</div>;
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!isAuthenticated) {
    return <div>Please log in.</div>;
  }

  return (
    <div className="container">
      <header className="header">
        <div className="school-name">Nombre del colegio</div>
        <nav className={`nav ${isMobileMenuOpen ? 'active' : ''}`}>
          {renderNavLinks()}
          <button onClick={onLogout} className="logout-button mobile-logout">
            Logout
          </button>
        </nav>
        <button
          className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}
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



