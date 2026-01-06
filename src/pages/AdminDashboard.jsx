import React from 'react';
import StudentAdmin from '../components/StudentAdmin';
import TeacherAdmin from '../components/TeacherAdmin';
import ParentAdmin from '../components/ParentAdmin';
import '../assets/AdminDashboard.css';

const AdminDashboard = () => {
  return (
    <div className="admin-dashboard">
      <div className="form-container">
        <h2>Student Administration</h2>
        <StudentAdmin />
      </div>
      <div className="form-container">
        <h2>Teacher Administration</h2>
        <TeacherAdmin />
      </div>
      <div className="form-container">
        <h2>Parent Administration</h2>
        <ParentAdmin />
      </div>
    </div>
  );
};

export default AdminDashboard;