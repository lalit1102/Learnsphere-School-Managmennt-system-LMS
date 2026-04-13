/**
 * Role-based access control constants
 * Define all available roles and their permissions
 */

export const ROLES = {
  ADMIN: "admin",
  TEACHER: "teacher",
  STUDENT: "student",
  PARENT: "parent", // optional
};

/**
 * Role hierarchy - defines what each role can access
 * Structure: role => array of allowed roles that can perform actions on this role
 */
export const ROLE_HIERARCHY = {
  // Only admin can manage teachers
  [ROLES.TEACHER]: [ROLES.ADMIN],
  
  // Only admin can manage students
  [ROLES.STUDENT]: [ROLES.ADMIN, ROLES.TEACHER],
  
  // Only admin can manage admins
  [ROLES.ADMIN]: [ROLES.ADMIN],
  
  // Parents can view limited student data
  [ROLES.PARENT]: [ROLES.ADMIN],
};

/**
 * Permission matrix - defines what each role can do
 */
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: {
    // User management
    createTeacher: true,
    updateTeacher: true,
    deleteTeacher: true,
    viewTeachers: true,
    
    createStudent: true,
    updateStudent: true,
    deleteStudent: true,
    viewStudents: true,
    
    // Class management
    createClass: true,
    updateClass: true,
    deleteClass: true,
    viewAllClasses: true,
    
    // Attendance & Exams
    viewAllAttendance: true,
    viewAllExams: true,
    
    // Settings & Reports
    manageSettings: true,
    viewReports: true,
    manageAcademicYear: true,
  },
  
  [ROLES.TEACHER]: {
    // User management - NO CREATE/UPDATE/DELETE for other teachers
    createTeacher: false,
    updateTeacher: false,
    deleteTeacher: false,
    viewTeachers: false,
    
    // Students - can view only assigned class students
    createStudent: false,
    updateStudent: false,
    deleteStudent: false,
    viewStudents: true, // only assigned class
    
    // Class management - can view assigned classes only
    createClass: false,
    updateClass: false,
    deleteClass: false,
    viewAllClasses: false,
    viewAssignedClasses: true,
    
    // Attendance & Exams - can manage for own classes
    takeAttendance: true,
    viewClassAttendance: true,
    createExam: true,
    createAssignment: true,
    viewClassExams: true,
    
    // Settings
    manageSettings: false,
    viewReports: false,
  },
  
  [ROLES.STUDENT]: {
    // NO creation/deletion permissions
    createTeacher: false,
    createStudent: false,
    createClass: false,
    
    // View only own data
    viewOwnDashboard: true,
    viewOwnAttendance: true,
    viewOwnAssignments: true,
    viewOwnExams: true,
    viewOwnTimetable: true,
    
    // NO management permissions
    manageSettings: false,
    viewReports: false,
  },
};

// Helper function to check if user has permission
export const hasPermission = (userRole, permission) => {
  const permissions = ROLE_PERMISSIONS[userRole];
  if (!permissions) return false;
  return permissions[permission] === true;
};

export default {
  ROLES,
  ROLE_HIERARCHY,
  ROLE_PERMISSIONS,
  hasPermission,
};
