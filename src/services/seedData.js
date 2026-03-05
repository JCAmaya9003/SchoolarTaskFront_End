/**
 * Seed Data
 *
 * Initial mock data for testing and development.
 * Automatically loaded when USE_BACKEND is false.
 */

import { STORAGE_KEYS } from "../config/appConfig";
import * as storageService from "./storageService";

/**
 * Initialize all seed data in localStorage
 */
export const initializeSeedData = () => {
  // Set to true to force a fresh reload of all seed data
  const forceReset = true;

  if (!forceReset && storageService.hasItem(STORAGE_KEYS.USERS)) {
    console.log("Seed data already exists. Skipping initialization.");
    return;
  }

  console.log("Initializing seed data...");

  storageService.setItem(STORAGE_KEYS.USERS, SEED_USERS);
  storageService.setItem(STORAGE_KEYS.STUDENTS, SEED_STUDENTS);
  storageService.setItem(STORAGE_KEYS.TEACHERS, SEED_TEACHERS);
  storageService.setItem(STORAGE_KEYS.PARENTS, SEED_PARENTS);
  storageService.setItem(STORAGE_KEYS.NEWS, SEED_NEWS);
  storageService.setItem(STORAGE_KEYS.GRADES, SEED_GRADES);
  storageService.setItem(STORAGE_KEYS.EVALUATIONS, SEED_EVALUATIONS);
  storageService.setItem(STORAGE_KEYS.RESERVATIONS, SEED_RESERVATIONS);
  storageService.setItem(STORAGE_KEYS.ACADEMIC_PLACES, SEED_ACADEMIC_PLACES);
  storageService.setItem(STORAGE_KEYS.GRADE_SECTIONS, SEED_GRADE_SECTIONS);
  storageService.setItem(STORAGE_KEYS.SUBJECTS, SEED_SUBJECTS);

  console.log("Seed data initialized successfully!");
  console.log(
    "REMINDER: Set forceReset = false in seedData.js after data is stable.",
  );
};

// USERS (login accounts for all roles)
const SEED_USERS = [
  {
    email: "admin@school.com",
    password: "admin123",
    role: "admin",
    firstName: "Admin",
    lastName: "User",
  },
  // Teacher accounts
  {
    email: "teacher@school.com",
    password: "teacher123",
    role: "teacher",
    firstName: "John",
    lastName: "Smith",
  },
  {
    email: "sarah.davis@school.com",
    password: "teacher123",
    role: "teacher",
    firstName: "Sarah",
    lastName: "Davis",
  },
  {
    email: "michael.brown@school.com",
    password: "teacher123",
    role: "teacher",
    firstName: "Michael",
    lastName: "Brown",
  },
  // Parent accounts
  {
    email: "parent@school.com",
    password: "parent123",
    role: "parent",
    firstName: "Mary",
    lastName: "Johnson",
  },
  {
    email: "robert.taylor@school.com",
    password: "parent123",
    role: "parent",
    firstName: "Robert",
    lastName: "Taylor",
  },
  // Student accounts
  {
    email: "student@school.com",
    password: "student123",
    role: "student",
    firstName: "Emma",
    lastName: "Williams",
  },
  {
    email: "liam.johnson@school.com",
    password: "student123",
    role: "student",
    firstName: "Liam",
    lastName: "Johnson",
  },
  {
    email: "oliver.taylor@school.com",
    password: "student123",
    role: "student",
    firstName: "Oliver",
    lastName: "Taylor",
  },
  {
    email: "sophia.martinez@school.com",
    password: "student123",
    role: "student",
    firstName: "Sophia",
    lastName: "Martinez",
  },
  {
    email: "noah.anderson@school.com",
    password: "student123",
    role: "student",
    firstName: "Noah",
    lastName: "Anderson",
  },
];

// TEACHERS
const SEED_TEACHERS = [
  {
    role: "teacher",
    firstName: "John",
    lastName: "Smith",
    email: "teacher@school.com",
    password: "teacher123",
    birth_date: "1985-06-15",
    roleName: "Teacher",
    gender: "Male",
    address: "123 Oak Street",
    nationality: "American",
    phone: "+1-555-0101",
    speciality: "Mathematics & Physics",
    assignments: [
      {
        subjects: ["Mathematics", "Physics"],
        grade_section: { grade: "5", section: "A" },
      },
      {
        subjects: ["Mathematics"],
        grade_section: { grade: "6", section: "B" },
      },
    ],
  },
  {
    role: "teacher",
    firstName: "Sarah",
    lastName: "Davis",
    email: "sarah.davis@school.com",
    password: "teacher123",
    birth_date: "1988-03-22",
    roleName: "Teacher",
    gender: "Female",
    address: "456 Pine Avenue",
    nationality: "American",
    phone: "+1-555-0102",
    speciality: "Languages",
    assignments: [
      {
        subjects: ["English", "Spanish"],
        grade_section: { grade: "5", section: "A" },
      },
      {
        subjects: ["English", "Spanish"],
        grade_section: { grade: "7", section: "C" },
      },
    ],
  },
  {
    role: "teacher",
    firstName: "Michael",
    lastName: "Brown",
    email: "michael.brown@school.com",
    password: "teacher123",
    birth_date: "1982-11-08",
    roleName: "Teacher",
    gender: "Male",
    address: "789 Maple Drive",
    nationality: "American",
    phone: "+1-555-0103",
    speciality: "Sciences",
    assignments: [
      {
        subjects: ["Chemistry", "Biology", "Mathematics"],
        grade_section: { grade: "8", section: "A" },
      },
      {
        subjects: ["History"],
        grade_section: { grade: "6", section: "B" },
      },
    ],
  },
];

// STUDENTS
const SEED_STUDENTS = [
  {
    role: "student",
    firstName: "Emma",
    lastName: "Williams",
    email: "student@school.com",
    password: "student123",
    birth_date: "2014-04-10",
    roleName: "Student",
    gender: "Female",
    address: "321 Elm Street",
    nationality: "American",
    parent_email: "parent@school.com",
    grade: "5",
    section: "A",
    allergies: "None",
    medical_conditions: "None",
    emergency_contact: { firstName: "Mary Johnson", phone: "+1-555-0201" },
  },
  {
    role: "student",
    firstName: "Liam",
    lastName: "Johnson",
    email: "liam.johnson@school.com",
    password: "student123",
    birth_date: "2012-08-22",
    roleName: "Student",
    gender: "Male",
    address: "321 Elm Street",
    nationality: "American",
    parent_email: "parent@school.com",
    grade: "7",
    section: "C",
    allergies: "Peanuts",
    medical_conditions: "Asthma",
    emergency_contact: { firstName: "Mary Johnson", phone: "+1-555-0201" },
  },
  {
    role: "student",
    firstName: "Oliver",
    lastName: "Taylor",
    email: "oliver.taylor@school.com",
    password: "student123",
    birth_date: "2014-02-14",
    roleName: "Student",
    gender: "Male",
    address: "654 Cedar Lane",
    nationality: "American",
    parent_email: "robert.taylor@school.com",
    grade: "5",
    section: "A",
    allergies: "None",
    medical_conditions: "None",
    emergency_contact: { firstName: "Robert Taylor", phone: "+1-555-0202" },
  },
  {
    role: "student",
    firstName: "Sophia",
    lastName: "Martinez",
    email: "sophia.martinez@school.com",
    password: "student123",
    birth_date: "2013-07-30",
    roleName: "Student",
    gender: "Female",
    address: "987 Birch Road",
    nationality: "American",
    parent_email: "ana.martinez@school.com",
    grade: "6",
    section: "B",
    allergies: "Lactose",
    medical_conditions: "None",
    emergency_contact: { firstName: "Ana Martinez", phone: "+1-555-0203" },
  },
  {
    role: "student",
    firstName: "Noah",
    lastName: "Anderson",
    email: "noah.anderson@school.com",
    password: "student123",
    birth_date: "2011-12-05",
    roleName: "Student",
    gender: "Male",
    address: "147 Spruce Street",
    nationality: "American",
    parent_email: "james.anderson@school.com",
    grade: "8",
    section: "A",
    allergies: "None",
    medical_conditions: "None",
    emergency_contact: { firstName: "James Anderson", phone: "+1-555-0204" },
  },
];

// PARENTS
const SEED_PARENTS = [
  {
    role: "parent",
    firstName: "Mary",
    lastName: "Johnson",
    email: "parent@school.com",
    password: "parent123",
    birth_date: "1985-05-20",
    roleName: "Parent",
    gender: "Female",
    address: "321 Elm Street",
    nationality: "American",
    phone: "+1-555-0201",
    work_phone: "+1-555-0301",
    work_place: "Tech Corp",
    profession: "Software Engineer",
  },
  {
    role: "parent",
    firstName: "Robert",
    lastName: "Taylor",
    email: "robert.taylor@school.com",
    password: "parent123",
    birth_date: "1982-09-15",
    roleName: "Parent",
    gender: "Male",
    address: "654 Cedar Lane",
    nationality: "American",
    phone: "+1-555-0202",
    work_phone: "+1-555-0302",
    work_place: "City Hospital",
    profession: "Doctor",
  },
];

// NEWS
const SEED_NEWS = [
  {
    _id: "1",
    title: "Welcome Back to School!",
    content:
      "We are excited to welcome all students back for the new academic year. Classes begin next Monday.",
    date: new Date("2024-08-20").toISOString(),
    email: "admin@school.com",
    user: { email: "admin@school.com", firstName: "Admin", lastName: "User" },
  },
  {
    _id: "2",
    title: "Parent-Teacher Conference",
    content:
      "Parent-teacher conferences will be held on Friday, September 15th from 3:00 PM to 7:00 PM.",
    date: new Date("2024-09-01").toISOString(),
    email: "admin@school.com",
    user: { email: "admin@school.com", firstName: "Admin", lastName: "User" },
  },
  {
    _id: "3",
    title: "Science Fair Next Month",
    content:
      "The annual science fair will take place on October 20th. All students are encouraged to participate!",
    date: new Date("2024-09-10").toISOString(),
    email: "teacher@school.com",
    user: { email: "teacher@school.com", firstName: "John", lastName: "Smith" },
  },
  {
    _id: "4",
    title: "Sports Day Schedule",
    content:
      "Sports Day is scheduled for November 5th. Events include track, field, and team sports.",
    date: new Date("2024-10-01").toISOString(),
    email: "admin@school.com",
    user: { email: "admin@school.com", firstName: "Admin", lastName: "User" },
  },
  {
    _id: "5",
    title: "Holiday Break Notice",
    content:
      "School will be closed for winter break from December 20th to January 3rd. Happy holidays!",
    date: new Date("2024-11-15").toISOString(),
    email: "admin@school.com",
    user: { email: "admin@school.com", firstName: "Admin", lastName: "User" },
  },
];

// EVALUATIONS (Subject plans: graded items with % weights)
// Each evaluation belongs to a subject + grade + section.
// All evaluations for the same subject/grade/section must sum to 100%.
const SEED_EVALUATIONS = [
  // Grade 5-A / Mathematics (John Smith)
  {
    _id: "ev1",
    name: "First Partial Exam",
    percentage: 30,
    subject: "Mathematics",
    grade: "5",
    section: "A",
  },
  {
    _id: "ev2",
    name: "Second Partial Exam",
    percentage: 30,
    subject: "Mathematics",
    grade: "5",
    section: "A",
  },
  {
    _id: "ev3",
    name: "Final Exam",
    percentage: 25,
    subject: "Mathematics",
    grade: "5",
    section: "A",
  },
  {
    _id: "ev4",
    name: "Homework & Quizzes",
    percentage: 15,
    subject: "Mathematics",
    grade: "5",
    section: "A",
  },

  // Grade 5-A / Physics (John Smith)
  {
    _id: "ev5",
    name: "Lab Work",
    percentage: 30,
    subject: "Physics",
    grade: "5",
    section: "A",
  },
  {
    _id: "ev6",
    name: "Midterm Exam",
    percentage: 35,
    subject: "Physics",
    grade: "5",
    section: "A",
  },
  {
    _id: "ev7",
    name: "Final Exam",
    percentage: 35,
    subject: "Physics",
    grade: "5",
    section: "A",
  },

  // Grade 5-A / English (Sarah Davis)
  {
    _id: "ev8",
    name: "Reading Comprehension",
    percentage: 25,
    subject: "English",
    grade: "5",
    section: "A",
  },
  {
    _id: "ev9",
    name: "Writing Assignment",
    percentage: 25,
    subject: "English",
    grade: "5",
    section: "A",
  },
  {
    _id: "ev10",
    name: "Oral Presentation",
    percentage: 25,
    subject: "English",
    grade: "5",
    section: "A",
  },
  {
    _id: "ev11",
    name: "Final Exam",
    percentage: 25,
    subject: "English",
    grade: "5",
    section: "A",
  },

  // Grade 5-A / Spanish (Sarah Davis)
  {
    _id: "ev12",
    name: "Grammar Test",
    percentage: 30,
    subject: "Spanish",
    grade: "5",
    section: "A",
  },
  {
    _id: "ev13",
    name: "Oral Exam",
    percentage: 30,
    subject: "Spanish",
    grade: "5",
    section: "A",
  },
  {
    _id: "ev14",
    name: "Final Exam",
    percentage: 40,
    subject: "Spanish",
    grade: "5",
    section: "A",
  },

  // Grade 6-B / Mathematics (John Smith)
  {
    _id: "ev15",
    name: "First Partial",
    percentage: 35,
    subject: "Mathematics",
    grade: "6",
    section: "B",
  },
  {
    _id: "ev16",
    name: "Second Partial",
    percentage: 35,
    subject: "Mathematics",
    grade: "6",
    section: "B",
  },
  {
    _id: "ev17",
    name: "Final Exam",
    percentage: 30,
    subject: "Mathematics",
    grade: "6",
    section: "B",
  },

  // Grade 6-B / History (Michael Brown)
  {
    _id: "ev18",
    name: "Research Project",
    percentage: 40,
    subject: "History",
    grade: "6",
    section: "B",
  },
  {
    _id: "ev19",
    name: "Midterm",
    percentage: 30,
    subject: "History",
    grade: "6",
    section: "B",
  },
  {
    _id: "ev20",
    name: "Final Exam",
    percentage: 30,
    subject: "History",
    grade: "6",
    section: "B",
  },

  // Grade 7-C / English (Sarah Davis)
  {
    _id: "ev21",
    name: "Essay",
    percentage: 30,
    subject: "English",
    grade: "7",
    section: "C",
  },
  {
    _id: "ev22",
    name: "Literature Test",
    percentage: 30,
    subject: "English",
    grade: "7",
    section: "C",
  },
  {
    _id: "ev23",
    name: "Final Exam",
    percentage: 40,
    subject: "English",
    grade: "7",
    section: "C",
  },

  // Grade 7-C / Spanish (Sarah Davis)
  {
    _id: "ev24",
    name: "Composition",
    percentage: 30,
    subject: "Spanish",
    grade: "7",
    section: "C",
  },
  {
    _id: "ev25",
    name: "Speaking Test",
    percentage: 30,
    subject: "Spanish",
    grade: "7",
    section: "C",
  },
  {
    _id: "ev26",
    name: "Final Exam",
    percentage: 40,
    subject: "Spanish",
    grade: "7",
    section: "C",
  },

  // Grade 8-A / Chemistry (Michael Brown)
  {
    _id: "ev27",
    name: "Lab Reports",
    percentage: 30,
    subject: "Chemistry",
    grade: "8",
    section: "A",
  },
  {
    _id: "ev28",
    name: "Midterm Exam",
    percentage: 35,
    subject: "Chemistry",
    grade: "8",
    section: "A",
  },
  {
    _id: "ev29",
    name: "Final Exam",
    percentage: 35,
    subject: "Chemistry",
    grade: "8",
    section: "A",
  },

  // Grade 8-A / Biology (Michael Brown)
  {
    _id: "ev30",
    name: "Dissection Lab",
    percentage: 25,
    subject: "Biology",
    grade: "8",
    section: "A",
  },
  {
    _id: "ev31",
    name: "Midterm Exam",
    percentage: 35,
    subject: "Biology",
    grade: "8",
    section: "A",
  },
  {
    _id: "ev32",
    name: "Final Exam",
    percentage: 40,
    subject: "Biology",
    grade: "8",
    section: "A",
  },

  // Grade 8-A / Mathematics (Michael Brown)
  {
    _id: "ev33",
    name: "Problem Sets",
    percentage: 20,
    subject: "Mathematics",
    grade: "8",
    section: "A",
  },
  {
    _id: "ev34",
    name: "Midterm Exam",
    percentage: 40,
    subject: "Mathematics",
    grade: "8",
    section: "A",
  },
  {
    _id: "ev35",
    name: "Final Exam",
    percentage: 40,
    subject: "Mathematics",
    grade: "8",
    section: "A",
  },
];

// GRADES (student scores linked to evaluations)
const SEED_GRADES = [
  // Emma Williams (5-A) — Mathematics
  {
    _id: "g1",
    evaluationId: "ev1",
    studentEmail: "student@school.com",
    subject: "Mathematics",
    grade: "5",
    section: "A",
    score: 88,
    teacherEmail: "teacher@school.com",
    annulled: false,
  },
  {
    _id: "g2",
    evaluationId: "ev2",
    studentEmail: "student@school.com",
    subject: "Mathematics",
    grade: "5",
    section: "A",
    score: 92,
    teacherEmail: "teacher@school.com",
    annulled: false,
  },
  {
    _id: "g3",
    evaluationId: "ev4",
    studentEmail: "student@school.com",
    subject: "Mathematics",
    grade: "5",
    section: "A",
    score: 95,
    teacherEmail: "teacher@school.com",
    annulled: false,
  },
  // Emma (5-A) — Physics
  {
    _id: "g4",
    evaluationId: "ev5",
    studentEmail: "student@school.com",
    subject: "Physics",
    grade: "5",
    section: "A",
    score: 85,
    teacherEmail: "teacher@school.com",
    annulled: false,
  },
  {
    _id: "g5",
    evaluationId: "ev6",
    studentEmail: "student@school.com",
    subject: "Physics",
    grade: "5",
    section: "A",
    score: 90,
    teacherEmail: "teacher@school.com",
    annulled: false,
  },
  // Emma (5-A) — English
  {
    _id: "g6",
    evaluationId: "ev8",
    studentEmail: "student@school.com",
    subject: "English",
    grade: "5",
    section: "A",
    score: 97,
    teacherEmail: "sarah.davis@school.com",
    annulled: false,
  },
  {
    _id: "g7",
    evaluationId: "ev9",
    studentEmail: "student@school.com",
    subject: "English",
    grade: "5",
    section: "A",
    score: 93,
    teacherEmail: "sarah.davis@school.com",
    annulled: false,
  },
  {
    _id: "g8",
    evaluationId: "ev10",
    studentEmail: "student@school.com",
    subject: "English",
    grade: "5",
    section: "A",
    score: 88,
    teacherEmail: "sarah.davis@school.com",
    annulled: false,
  },

  // Oliver Taylor (5-A) — Mathematics
  {
    _id: "g9",
    evaluationId: "ev1",
    studentEmail: "oliver.taylor@school.com",
    subject: "Mathematics",
    grade: "5",
    section: "A",
    score: 72,
    teacherEmail: "teacher@school.com",
    annulled: false,
  },
  {
    _id: "g10",
    evaluationId: "ev2",
    studentEmail: "oliver.taylor@school.com",
    subject: "Mathematics",
    grade: "5",
    section: "A",
    score: 78,
    teacherEmail: "teacher@school.com",
    annulled: false,
  },
  {
    _id: "g11",
    evaluationId: "ev3",
    studentEmail: "oliver.taylor@school.com",
    subject: "Mathematics",
    grade: "5",
    section: "A",
    score: 80,
    teacherEmail: "teacher@school.com",
    annulled: false,
  },
  // Oliver (5-A) — Physics
  {
    _id: "g12",
    evaluationId: "ev5",
    studentEmail: "oliver.taylor@school.com",
    subject: "Physics",
    grade: "5",
    section: "A",
    score: 80,
    teacherEmail: "teacher@school.com",
    annulled: false,
  },
  {
    _id: "g13",
    evaluationId: "ev6",
    studentEmail: "oliver.taylor@school.com",
    subject: "Physics",
    grade: "5",
    section: "A",
    score: 82,
    teacherEmail: "teacher@school.com",
    annulled: false,
  },

  // Sophia Martinez (6-B) — Mathematics
  {
    _id: "g14",
    evaluationId: "ev15",
    studentEmail: "sophia.martinez@school.com",
    subject: "Mathematics",
    grade: "6",
    section: "B",
    score: 90,
    teacherEmail: "teacher@school.com",
    annulled: false,
  },
  {
    _id: "g15",
    evaluationId: "ev16",
    studentEmail: "sophia.martinez@school.com",
    subject: "Mathematics",
    grade: "6",
    section: "B",
    score: 87,
    teacherEmail: "teacher@school.com",
    annulled: false,
  },
  // Sophia (6-B) — History
  {
    _id: "g16",
    evaluationId: "ev18",
    studentEmail: "sophia.martinez@school.com",
    subject: "History",
    grade: "6",
    section: "B",
    score: 85,
    teacherEmail: "michael.brown@school.com",
    annulled: false,
  },

  // Liam Johnson (7-C) — English
  {
    _id: "g17",
    evaluationId: "ev21",
    studentEmail: "liam.johnson@school.com",
    subject: "English",
    grade: "7",
    section: "C",
    score: 82,
    teacherEmail: "sarah.davis@school.com",
    annulled: false,
  },
  {
    _id: "g18",
    evaluationId: "ev22",
    studentEmail: "liam.johnson@school.com",
    subject: "English",
    grade: "7",
    section: "C",
    score: 85,
    teacherEmail: "sarah.davis@school.com",
    annulled: false,
  },
  // Liam (7-C) — Spanish
  {
    _id: "g19",
    evaluationId: "ev24",
    studentEmail: "liam.johnson@school.com",
    subject: "Spanish",
    grade: "7",
    section: "C",
    score: 79,
    teacherEmail: "sarah.davis@school.com",
    annulled: false,
  },

  // Noah Anderson (8-A) — Chemistry
  {
    _id: "g20",
    evaluationId: "ev27",
    studentEmail: "noah.anderson@school.com",
    subject: "Chemistry",
    grade: "8",
    section: "A",
    score: 88,
    teacherEmail: "michael.brown@school.com",
    annulled: false,
  },
  {
    _id: "g21",
    evaluationId: "ev28",
    studentEmail: "noah.anderson@school.com",
    subject: "Chemistry",
    grade: "8",
    section: "A",
    score: 84,
    teacherEmail: "michael.brown@school.com",
    annulled: false,
  },
  // Noah (8-A) — Biology
  {
    _id: "g22",
    evaluationId: "ev30",
    studentEmail: "noah.anderson@school.com",
    subject: "Biology",
    grade: "8",
    section: "A",
    score: 92,
    teacherEmail: "michael.brown@school.com",
    annulled: false,
  },
  {
    _id: "g23",
    evaluationId: "ev31",
    studentEmail: "noah.anderson@school.com",
    subject: "Biology",
    grade: "8",
    section: "A",
    score: 89,
    teacherEmail: "michael.brown@school.com",
    annulled: false,
  },
  // Noah (8-A) — Mathematics
  {
    _id: "g24",
    evaluationId: "ev33",
    studentEmail: "noah.anderson@school.com",
    subject: "Mathematics",
    grade: "8",
    section: "A",
    score: 91,
    teacherEmail: "michael.brown@school.com",
    annulled: false,
  },
];

// ACADEMIC PLACES
const SEED_ACADEMIC_PLACES = [
  { _id: "1", place: "Library", capacity: 50, type: "Study Area" },
  { _id: "2", place: "Computer Lab", capacity: 30, type: "Classroom" },
  { _id: "3", place: "Science Lab", capacity: 25, type: "Laboratory" },
  { _id: "4", place: "Gymnasium", capacity: 200, type: "Sports Facility" },
  { _id: "5", place: "Auditorium", capacity: 300, type: "Event Space" },
  { _id: "6", place: "Art Room", capacity: 20, type: "Classroom" },
];

// RESERVATIONS
const SEED_RESERVATIONS = [
  {
    _id: "1",
    place: { _id: "1", place: "Library" },
    userEmail: "teacher@school.com",
    user: { email: "teacher@school.com", firstName: "John", lastName: "Smith" },
    description: "Math study group session",
    start_date: new Date(Date.now() + 86400000).toISOString(),
    end_date: new Date(Date.now() + 86400000 + 3600000).toISOString(),
  },
  {
    _id: "2",
    place: { _id: "3", place: "Science Lab" },
    userEmail: "michael.brown@school.com",
    user: {
      email: "michael.brown@school.com",
      firstName: "Michael",
      lastName: "Brown",
    },
    description: "Chemistry experiment demonstration",
    start_date: new Date(Date.now() + 172800000).toISOString(),
    end_date: new Date(Date.now() + 172800000 + 7200000).toISOString(),
  },
];

// GRADE SECTIONS
const SEED_GRADE_SECTIONS = [
  {
    grade: "5",
    section: "A",
    subjects: ["Mathematics", "Physics", "English", "Spanish"],
  },
  { grade: "6", section: "B", subjects: ["Mathematics", "History"] },
  { grade: "7", section: "C", subjects: ["English", "Spanish", "Geography"] },
  {
    grade: "8",
    section: "A",
    subjects: ["Chemistry", "Biology", "Mathematics"],
  },
];

// SUBJECTS
const SEED_SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Spanish",
  "History",
  "Geography",
  "Physical Education",
  "Arts",
  "Music",
  "Computer Science",
];
