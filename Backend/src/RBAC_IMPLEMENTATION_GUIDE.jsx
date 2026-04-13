/**
 * ROLE-BASED ACCESS CONTROL (RBAC) IMPLEMENTATION GUIDE
 * =====================================================
 * 
 * Complete guide for implementing and using RBAC in your MERN school system
 */

/**
 * ============================================
 * 1. BACKEND IMPLEMENTATION
 * ============================================
 */

// FILE: src/constants/roles.js
// Already created with ROLES, ROLE_HIERARCHY, ROLE_PERMISSIONS

/**
 * EXAMPLE: Quick role check
 */
import { hasPermission } from '../constants/roles.js';

if (hasPermission('admin', 'createTeacher')) {
  // Admin can create teachers
}

/**
 * ============================================
 * 2. PROTECTING ROUTES - PATTERNS
 * ============================================
 */

/**
 * PATTERN 1: Admin Only
 * Only admin users can access
 * 
 * Usage: DELETE operations, sensitive data
 */
router.delete(
  '/delete/:id',
  protect,            // Verify token
  authorize(['admin']), // Only admin
  deleteController
);

// OR using shorthand
router.delete(
  '/delete/:id',
  protect,
  adminOnly, // shorthand middleware
  deleteController
);

/**
 * PATTERN 2: Multiple Roles
 * Admin OR Teacher can access
 * 
 * Usage: View operations, read-only data
 */
router.get(
  '/classes',
  protect,
  authorize(['admin', 'teacher']),
  getClassesController
);

// OR using shorthand
router.get(
  '/classes',
  protect,
  teacherOrAdmin, // shorthand middleware
  getClassesController
);

/**
 * PATTERN 3: Permission-Based Check
 * Use specific permission instead of role
 * More granular control
 */
router.post(
  '/attendance',
  protect,
  checkPermission('takeAttendance'), // Check permission, not role
  takeAttendanceController
);

/**
 * PATTERN 4: Ownership Check
 * User can only access their own data
 * 
 * Usage: Student viewing own grades, teacher viewing own classes
 */
router.get(
  '/profile/:id',
  protect,
  authorize(['admin', 'student']),
  checkOwnership, // Ensures user is accessing their own data
  getProfileController
);

/**
 * PATTERN 5: Combined Checks
 * Multiple middleware for complex logic
 * 
 * Usage: Teacher taking attendance for their class
 */
router.post(
  '/class/:classId/attendance',
  protect,                          // Must be logged in
  authorize(['admin', 'teacher']),  // Must be admin or teacher
  checkTeacherOwnership,            // Teacher must own the class
  checkPermission('takeAttendance'), // Must have permission
  takeAttendanceController
);

/**
 * ============================================
 * 3. ERROR RESPONSES
 * ============================================
 */

// 401 Unauthorized - No token or invalid token
// Response:
{
  "success": false,
  "message": "Not authorized, no token provided"
}

// 403 Forbidden - User lacks permission
// Response:
{
  "success": false,
  "message": "Access denied. Your role 'student' is not authorized for this action.",
  "userRole": "student",
  "requiredRoles": ["admin"]
}

/**
 * ============================================
 * 4. FRONTEND IMPLEMENTATION - PATTERNS
 * ============================================
 */

// FILE: src/components/auth/RoleBasedUI.jsx
// Already created with utilities

/**
 * PATTERN 1: useShowFor Hook - Cleanest approach
 * Import and use the hook
 */
import { useShowFor } from '@/components/auth/RoleBasedUI';

export function Dashboard() {
  const { admin, teacher, student, teacherOrAdmin } = useShowFor();

  return (
    <>
      {admin && <AdminPanel />}
      {teacher && <TeacherPanel />}
      {student && <StudentPanel />}
      {teacherOrAdmin && <ExamList />}
    </>
  );
}

/**
 * PATTERN 2: RoleGuard Component
 * Wrap component that should only show for specific roles
 */
import { RoleGuard } from '@/components/auth/RoleBasedUI';

export function UserManagement() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <AddUserForm />
    </RoleGuard>
  );
}

/**
 * PATTERN 3: RoleButton Component
 * Button that only renders for specific roles
 */
import { RoleButton } from '@/components/auth/RoleBasedUI';

export function Toolbar() {
  return (
    <>
      <RoleButton
        roles={['admin']}
        onClick={handleAddTeacher}
        className="btn-primary"
      >
        Add Teacher
      </RoleButton>
    </>
  );
}

/**
 * PATTERN 4: ShowIfRole Component
 * Single role check
 */
import { ShowIfRole } from '@/components/auth/RoleBasedUI';

export function Features() {
  return (
    <ShowIfRole role="admin">
      <AdminOnlyFeature />
    </ShowIfRole>
  );
}

/**
 * PATTERN 5: useAuth Hook - Direct access
 * For complex logic or conditional API calls
 */
import { useAuth } from '@/context/AuthContext';

export function SmartComponent() {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'admin') {
      // Fetch all users
      fetchAllUsers();
    } else if (user?.role === 'teacher') {
      // Fetch only class students
      fetchClassStudents();
    }
  }, [user]);
}

/**
 * ============================================
 * 5. COMPLETE IMPLEMENTATION CHECKLIST
 * ============================================
 */

// ✅ BACKEND
// [x] Create src/constants/roles.js with ROLES, PERMISSIONS
// [x] Update src/middleware/authMiddleware.js with utilities
// [x] Add protect middleware to all sensitive routes
// [x] Add authorize middleware with role checks
// [x] Add checkPermission for granular control
// [x] Add checkOwnership for user data protection
// [x] Create src/routes/teacherAdvancedRoutes.js
// [x] Create src/routes/studentRoutes.js
// [x] Update server.js to use these routes
// [x] Test all endpoints with different roles

// ✅ FRONTEND
// [x] Create src/components/auth/RoleBasedUI.jsx
// [x] Export useShowFor, RoleGuard, RoleButton, ShowIfRole
// [x] Add useShowFor hook to Dashboard component
// [x] Hide admin buttons for non-admin users
// [x] Hide teacher buttons for students
// [x] Show role-specific UI sections
// [x] Test conditional rendering with different users
// [x] Add error messages for denied access

/**
 * ============================================
 * 6. SECURITY BEST PRACTICES
 * ============================================
 */

// 1. ALWAYS verify on BOTH backend and frontend
//    - Frontend prevents accidental clicks
//    - Backend prevents direct API manipulation
✓ Correct: protect + authorize + frontend check
✗ Wrong: frontend check only

// 2. Use specific roles, not generic flags
//    - authorize(['admin']) --> GOOD
//    - if (user.isAdmin) --> BAD (frontend only)

// 3. Protect sensitive operations with multiple checks
//    - protect + authorize + checkPermission + checkOwnership

// 4. Return 403 for unauthorized access, not 404
//    - Prevents attackers from discovering endpoints
//    - But keep 403 to 403, not 404

// 5. Log all access denials
//    - Track who tried to access what
//    - Detect potential attacks

// 6. Never trust frontend role information
//    - Always decode JWT and fetch user role from database
//    - Never pass role in cookie/localStorage only

// 7. Update permissions in one place (src/constants/roles.js)
//    - Single source of truth
//    - Easy to audit and modify

/**
 * ============================================
 * 7. TESTING GUIDE
 * ============================================
 */

/**
 * MANUAL TESTING CHECKLIST
 */

// Admin User (admin@school.com)
// ✓ Can view all users
// ✓ Can add teacher
// ✓ Can add student
// ✓ Can delete teacher
// ✓ Can delete student
// ✓ Can manage settings
// ✓ "Add Teacher" button visible
// ✓ "Add Student" button visible

// Teacher User (teacher@school.com)
// ✓ Can view assigned classes
// ✓ Can take attendance
// ✓ Can create exam
// ✓ Cannot add teacher
// ✓ Cannot add student
// ✓ Cannot manage settings
// ✓ "Add Teacher" button NOT visible
// ✓ "Add Student" button NOT visible (if implemented)
// ✓ Can see "Teacher Panel" on dashboard
// ✓ Cannot see admin panel

// Student User (student@school.com)
// ✓ Can see own dashboard
// ✓ Can see own attendance
// ✓ Can see own assignments
// ✓ Can see own exams
// ✓ Cannot add anyone
// ✓ Cannot take attendance
// ✓ Cannot create exam
// ✓ Cannot see teacher panel
// ✓ Cannot see admin panel
// ✓ Can see "Student Panel" on dashboard

/**
 * API TESTING with cURL/Postman
 */

// As Student - Should FAIL (403)
// DELETE http://localhost:5000/api/students/123
// headers: { Authorization: 'Bearer student_token' }
// Expected: 403 Forbidden

// As Teacher - Should FAIL (403)
// POST http://localhost:5000/api/teachers/create
// headers: { Authorization: 'Bearer teacher_token' }
// Expected: 403 Forbidden - "Your role 'teacher' is not authorized"

// As Admin - Should SUCCEED (200/201)
// POST http://localhost:5000/api/teachers/create
// headers: { Authorization: 'Bearer admin_token' }
// body: { name, email, password, role: 'teacher' }
// Expected: 201 Created

/**
 * ============================================
 * 8. COMMON MISTAKES TO AVOID
 * ============================================
 */

// ❌ WRONG: Only frontend check
if (user.role === 'admin') {
  // User can manipulate this with browser console
  showAdminPanel();
}

// ✅ CORRECT: Backend + Frontend
// Backend: protect + authorize(['admin'])
// Frontend: {admin && <AdminPanel />}

// ❌ WRONG: Case sensitive role checks
authorize(['Admin']) // Won't match 'admin'

// ✅ CORRECT: Use constants
import { ROLES } from '../constants/roles.js';
authorize([ROLES.ADMIN])

// ❌ WRONG: Unclear permissions
if (user.role === 'admin' || user.role === 'teacher') {
  // What exactly can they do?
}

// ✅ CORRECT: Permission-based
checkPermission('takeAttendance')

// ❌ WRONG: Not checking ownership
router.get('/user/:id', protect, authorize(['admin', 'student']), getUser)
// Student can view other students!

// ✅ CORRECT: Check ownership
router.get('/user/:id', protect, authorize(['admin', 'student']), checkOwnership, getUser)

/**
 * ============================================
 * 9. MIGRATION GUIDE
 * ============================================
 * 
 * If you're adding RBAC to existing routes:
 */

// Step 1: Identify which roles should access each route
// Step 2: Add protect + authorize to route
// Step 3: Test with admin user (should work)
// Step 4: Test with teacher user (may fail)
// Step 5: Test with student user (may fail)
// Step 6: Adjust authorize array based on requirements
// Step 7: Add frontend conditional rendering
// Step 8: Test entire flow

export default "See implementation files for code examples";
