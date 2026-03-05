import { useState } from "react";
import StudentAdmin from "../components/StudentAdmin";
import TeacherAdmin from "../components/TeacherAdmin";
import ParentAdmin from "../components/ParentAdmin";
import "../assets/AdminDashboard.css";

const TABS = [
  { id: "students", label: "Students", accent: "#059669" },
  { id: "teachers", label: "Teachers", accent: "#D97706" },
  { id: "parents", label: "Parents", accent: "#7C3AED" },
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("students");

  return (
    <div className="admin-dashboard">
      {/* Tab bar */}
      <div className="admin-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`admin-tab${activeTab === tab.id ? " admin-tab--active" : ""}`}
            style={
              activeTab === tab.id
                ? { borderBottomColor: tab.accent, color: tab.accent }
                : {}
            }
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content — one panel at a time, full width */}
      <div className="admin-panel">
        {activeTab === "students" && <StudentAdmin />}
        {activeTab === "teachers" && <TeacherAdmin />}
        {activeTab === "parents" && <ParentAdmin />}
      </div>
    </div>
  );
};

export default AdminDashboard;
