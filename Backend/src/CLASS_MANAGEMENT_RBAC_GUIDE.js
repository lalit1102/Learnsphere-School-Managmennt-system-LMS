/**
 * ROLE-BASED CLASS MANAGEMENT SYSTEM
 * ===================================
 * Complete Integration & Reference Guide
 * 
 * This guide demonstrates how to use the new RBAC class management system
 */

/**
 * ============================================
 * QUICK START
 * ============================================
 */

// STEP 1: Update Backend server.js
/*
import classRoutesRBAC from './src/routes/classRoutesRBAC.js';

// Use the new RBAC routes instead of old classRoutes
app.use('/api/classes', classRoutesRBAC);

// Keep or remove old classRoutes depending on compatibility needs
// app.use('/api/classes', classRouter); // OLD - replace with above
*/

// STEP 2: Update Frontend Dashboard
/*
import { ClassManager } from '@/components/classes/ClassManagement';

export function Dashboard() {
  return (
    <div>
      <ClassManager />  // Shows different UI based on role
    </div>
  );
}
*/

// STEP 3: Test
/*
1. Login as Admin  → See "Create Class" form + all classes
2. Login as Teacher → See only assigned classes + "Manage Students"
3. Login as Student → See only their assigned class + classmates
*/

/**
 * ============================================
 * FILE STRUCTURE
 * ============================================
 */

/*
Backend/
├── src/
│   ├── controllers/
│   │   ├── classController.js ..................... OLD (keep for now)
│   │   └── classControllerRBAC.js ................ ✅ NEW - Use this
│   └── routes/
│       ├── classRoutes.js ......................... OLD (keep for now)
│       └── classRoutesRBAC.js .................... ✅ NEW - Use this (in server.js)

Frontend/
└── src/
    └── components/
        └── classes/
            └── ClassManagement.jsx .............. ✅ NEW - Role-based UI
*/

/**
 * ============================================
 * BACKEND API ENDPOINTS
 * ============================================
 */

/**
 * ADMIN ROUTES (Admin Only)
 */

// Create class
POST /api/classes/create
Headers: { Authorization: 'Bearer token' }
Body: {
  "name": "Class 10-A",
  "academicYear": "605c72ef1a1234567890abcd",
  "classTeacher": "505c72ef1a1234567890def1",  // Optional
  "capacity": 40,
  "subjects": []
}
Response: 201 Created
{
  "success": true,
  "message": "Class created successfully",
  "class": { ... }
}

// Update class
PATCH /api/classes/:id
Headers: { Authorization: 'Bearer token' }
Body: {
  "name": "Class 10-B",
  "capacity": 45,
  "classTeacher": "new_teacher_id"
}
Response: 200 OK
{ "success": true, "class": { ... } }

// Delete class
DELETE /api/classes/:id
Response: 200 OK
{ "success": true, "message": "Class deleted successfully" }

/**
 * ROLE-BASED GET ROUTES (Everyone)
 */

// Get all classes (filtered by role)
GET /api/classes
- ADMIN:   Gets ALL classes
- TEACHER: Gets ONLY assigned classes
- STUDENT: Gets ONLY their class

Response: 200 OK
{
  "success": true,
  "count": 2,
  "total": 10,
  "page": 1,
  "pages": 5,
  "userRole": "admin",
  "classes": [ ... ]
}

// Get single class
GET /api/classes/:id
- ADMIN:   Can view ANY class
- TEACHER: Can view ONLY assigned
- STUDENT: Can view ONLY their class

Response: 200 OK
{ "success": true, "class": { ... } }

/**
 * STUDENT MANAGEMENT ROUTES (Admin & Teacher)
 */

// Add student to class
POST /api/classes/:classId/students/add
Headers: { Authorization: 'Bearer token' }
Body: { "studentId": "..." }
- ADMIN:   Can add to ANY class
- TEACHER: Can add to ONLY their class

Response: 200 OK
{ "success": true, "message": "Student added to class successfully" }

// Remove student from class
DELETE /api/classes/:classId/students/:studentId
- ADMIN:   Can remove from ANY class
- TEACHER: Can remove from ONLY their class

Response: 200 OK
{ "success": true, "message": "Student removed from class successfully" }

// Get class students
GET /api/classes/:classId/students
- ADMIN:   Can view ANY class's students
- TEACHER: Can view ONLY their class's students
- STUDENT: Can view ONLY if they're in the class

Response: 200 OK
{
  "success": true,
  "count": 35,
  "students": [ ... ]
}

/**
 * ============================================
 * ERROR RESPONSES
 * ============================================
 */

// 401 Unauthorized (No token)
{
  "success": false,
  "message": "Not authorized, no token provided"
}

// 403 Forbidden (Wrong role)
{
  "success": false,
  "message": "Access denied. Your role 'student' is not authorized for this action.",
  "userRole": "student",
  "requiredRoles": ["admin"]
}

// 403 Forbidden (Authorization check in controller)
{
  "success": false,
  "message": "You can only view your assigned classes"  // Teacher viewing other's class
}

// 400 Bad Request (Validation)
{
  "success": false,
  "message": "Class 'Math 10' already exists for this academic year"
}

// 404 Not Found
{
  "success": false,
  "message": "Class not found"
}

// 500 Server Error
{
  "success": false,
  "message": "Server error creating class",
  "error": "MongoDB error message"
}

/**
 * ============================================
 * FRONTEND COMPONENT USAGE
 * ============================================
 */

/**
 * 1. USE ClassManager (Main Component)
 * ====================================
 * Automatically shows appropriate UI based on user role
 */

import { ClassManager } from '@/components/classes/ClassManagement';

export function ClassesPage() {
  return <ClassManager />;
  
  // Shows:
  // - ADMIN:   Create class form + all classes
  // - TEACHER: Only my classes + manage students
  // - STUDENT: Only my class + classmates
}

/**
 * 2. USE Individual Components
 * =============================
 * For more granular control
 */

import {
  AdminClassCreation,
  TeacherClasses,
  StudentClass,
  AdminAllClasses,
} from '@/components/classes/ClassManagement';

export function Dashboard() {
  const { user } = useAuth();
  const { admin, teacher, student } = useShowFor();

  return (
    <div>
      {admin && (
        <>
          <AdminClassCreation onClassCreated={handleNewClass} />
          <AdminAllClasses />
        </>
      )}

      {teacher && <TeacherClasses />}

      {student && <StudentClass />}
    </div>
  );
}

/**
 * 3. EXAMPLE: Add Class Button with RoleButton
 * ==============================================
 */

import { RoleButton } from '@/components/auth/RoleBasedUI';

export function Toolbar() {
  return (
    <RoleButton
      roles={['admin']}  // Button only shows for admin
      onClick={handleAddClass}
      className="bg-blue-600 text-white px-4 py-2 rounded"
    >
      ➕ Add Class
    </RoleButton>
  );
}

// Teacher and student won't see this button at all

/**
 * 4. EXAMPLE: Hide Dangerous Actions
 * ====================================
 */

import { RoleGuard } from '@/components/auth/RoleBasedUI';

export function ClassActions() {
  return (
    <>
      {/* Only admin can see delete button */}
      <RoleGuard allowedRoles={['admin']}>
        <button onClick={deleteClass} className="btn-danger">
          Delete Class
        </button>
      </RoleGuard>

      {/* Teacher can manage students in their class */}
      <RoleGuard allowedRoles={['admin', 'teacher']}>
        <button onClick={manageStudents} className="btn-primary">
          Manage Students
        </button>
      </RoleGuard>
    </>
  );
}

/**
 * ============================================
 * ROLE-BASED BEHAVIOR MATRIX
 * ============================================
 */

/*
╔════════════════╦════════════════════╦═════════════════════╦═════════════════╗
║ OPERATION      ║ ADMIN              ║ TEACHER             ║ STUDENT         ║
╠════════════════╬════════════════════╬═════════════════════╬═════════════════╣
║ CREATE CLASS   ║ ✅ YES             ║ ❌ NO (403)         ║ ❌ NO (403)     ║
║                ║ POST /api/classes  ║                     ║                 ║
╠════════════════╬════════════════════╬═════════════════════╬═════════════════╣
║ VIEW CLASS     ║ ✅ Any class       ║ ✅ Assigned only    ║ ✅ Own class    ║
║                ║ GET /api/classes   ║ GET /api/classes    ║ GET /api/...    ║
║                ║ (no filter)        ║ (filtered)          ║ (filtered)      ║
╠════════════════╬════════════════════╬═════════════════════╬═════════════════╣
║ EDIT CLASS     ║ ✅ YES             ║ ❌ NO (403)         ║ ❌ NO (403)     ║
║                ║ PATCH /api/...     ║                     ║                 ║
╠════════════════╬════════════════════╬═════════════════════╬═════════════════╣
║ DELETE CLASS   ║ ✅ YES             ║ ❌ NO (403)         ║ ❌ NO (403)     ║
║                ║ DELETE /api/...    ║                     ║                 ║
╠════════════════╬════════════════════╬═════════════════════╬═════════════════╣
║ ADD STUDENT    ║ ✅ Any class       ║ ✅ Own class only   ║ ❌ NO (403)     ║
║                ║ POST /api/.../+add ║ POST /api/.../+add  ║                 ║
╠════════════════╬════════════════════╬═════════════════════╬═════════════════╣
║ VIEW STUDENTS  ║ ✅ Any class       ║ ✅ Own class only   ║ ✅ Same class   ║
║                ║ GET /api/.../...   ║ GET /api/.../...    ║ GET /api/.../.. ║
╚════════════════╩════════════════════╩═════════════════════╩═════════════════╝
*/

/**
 * ============================================
 * TESTING CHECKLIST
 * ============================================
 */

/*
[ ] Admin Tests
  [ ] Can create class - GET form, submit valid data, see 201
  [ ] Can edit class - PATCH endpoint, see 200
  [ ] Can delete class - DELETE endpoint, see 200
  [ ] Can add student - POST to /students/add, see 200
  [ ] Can view all classes - GET /classes returns all
  [ ] "Create Class" button is visible
  [ ] "Create Class" form is accessible
  [ ] Can search classes

[ ] Teacher Tests
  [ ] Can view ONLY assigned classes - GET /classes filtered
  [ ] Cannot create class - POST /classes/create returns 403
  [ ] Cannot edit class - PATCH /classes/:id returns 403
  [ ] Cannot delete class - DELETE /classes/:id returns 403
  [ ] Can add student to OWN class - POST /students/add works
  [ ] Cannot add student to OTHER class - returns 403
  [ ] "Create Class" button does NOT appear
  [ ] "Manage Students" button appears on own class

[ ] Student Tests
  [ ] Can view ONLY their class - GET /classes returns 1
  [ ] Cannot create, edit, delete - All POST/PATCH/DELETE return 403
  [ ] Cannot add/remove students - returns 403
  [ ] Can see classmates - GET /classes/:id/students works
  [ ] Cannot see OTHER class students - returns 403
  [ ] "Create Class" button does NOT appear
  [ ] "Manage Students" button does NOT appear
  [ ] Classmates list displays correctly

[ ] Frontend UI Tests
  [ ] Admin sees "Create Class" form
  [ ] Teacher sees "My Classes" section
  [ ] Student sees "My Class" section
  [ ] Buttons hidden appropriately for each role
  [ ] Error messages display correctly
  [ ] Loading states work
  [ ] Search function works (admin)

[ ] Error Handling
  [ ] Duplicate class name error shows
  [ ] Teacher at capacity error shows (can't add more)
  [ ] Invalid student ID error shows
  [ ] "Cannot delete class" if students enrolled (optional)
  [ ] Student already in class error shows
  [ ] Unauthorized access error shows
*/

/**
 * ============================================
 * IMPLEMENTATION STEPS
 * ============================================
 */

/*
1. Backend Setup (10 minutes)
   [ ] Copy classControllerRBAC.js to Backend/src/controllers/
   [ ] Copy classRoutesRBAC.js to Backend/src/routes/
   [ ] Update server.js to use classRoutesRBAC instead of classRoutes
   [ ] Test endpoints with Postman (different roles)

2. Frontend Setup (10 minutes)
   [ ] Copy ClassManagement.jsx to Client/src/components/classes/
   [ ] Import ClassManager in Dashboard or Classes page
   [ ] Replace old class components with new ones
   [ ] Test UI with different user roles

3. Integration (5 minutes)
   [ ] Verify RoleBasedUI.jsx exists in components/auth/
   [ ] Check useShowFor hook is working
   [ ] Verify useAuth context is available
   [ ] Check api.js has correct base URL

4. Testing (15 minutes)
   [ ] Test each role's access patterns
   [ ] Verify 403 errors for unauthorized access
   [ ] Check buttons/components are hidden appropriately
   [ ] Verify ownership checks work
   [ ] Test error handling

5. Cleanup (5 minutes)
   [ ] Keep old classController.js as backup (optional)
   [ ] Update any imports in other files
   [ ] Add comments explaining RBAC system
   [ ] Document role-based behavior for team
*/

/**
 * ============================================
 * CUSTOMIZATION GUIDE
 * ============================================
 */

/*
To add a new role (e.g., Parent):

1. Update Backend User model:
   - Add 'parent' to UserRole enum

2. Update Role Permissions (src/constants/roles.js):
   - Add PARENT role with permissions

3. Update Class Controller:
   In getAllClasses(), add:
   else if (userRole === 'parent') {
     // Parent sees student's class only
     // Find child's assignment in database
   }

4. Update Frontend Components:
   - Add parentView to ClassManagement.jsx
   - Use useShowFor hook with parent flag

5. Update Routes:
   - Add parent to authorize() where appropriate
*/

/**
 * ============================================
 * MIGRATION FROM OLD SYSTEM
 * ============================================
 */

/*
If transitioning from old classRoutes.js:

Option A: Gradual Migration
- Keep both routes temporarily
- Redirect using URL rewriting
- Test new RBAC routes separately
- Remove old routes after verification

Option B: Complete Migration
- Backup old classController.js
- Replace all imports immediately
- Test everything thoroughly
- Delete old files

Recommended: Option A (safer)

Steps:
1. Add classRoutesRBAC to server.js
2. Update frontend imports to use new components
3. Test thoroughly with all roles
4. Remove old imports once verified
5. Delete old classRoutes.js and classController.js
*/

/**
 * ============================================
 * PERFORMANCE CONSIDERATIONS
 * ============================================
 */

/*
Pagination:
- GET /classes?page=2&limit=10
- Recommended limit: 10-20 classes per page
- Use pagination in teacher/admin views

Searching:
- GET /classes?search=class_name
- Implemented in ClassManagement.jsx
- Debounced to 300ms in frontend

Population:
- Queries populate: academicYear, classTeacher, students, subjects
- Consider using projection to exclude large arrays in list view
- Use separate endpoint for detailed view

Caching:
- Consider caching class list in Context/Redux
- Invalidate on create/update/delete
- Implement React Query or similar for efficiency
*/

/**
 * ============================================
 * DEBUGGING TIPS
 * ============================================
 */

/*
Issue: Always getting 403 Forbidden
- Check middleware order in route: protect THEN authorize
- Verify token in cookies/headers
- Check role in JWT matches database role
- Ensure authorize() array has correct role spelling

Issue: Teacher can't see any classes
- Check teacher is actually assigned as classTeacher
- Verify query filter: { classTeacher: userId }
- Check _id comparison uses .equals() in MongoDB

Issue: Student can see other classes
- Verify checkOwnership middleware is on route
- Ensure students array is populated with student ID

Issue: Buttons not hiding
- Check useShowFor() hook is returning correct values
- Verify user role is loaded before rendering
- Check AuthProvider is wrapping the app
- Inspect browser console for errors

Issue: API returning wrong classes
- Log the role and userId on backend
- Check MongoDB query with correct filter
- Verify populate() is working correctly
- Use res.json({ userRole, userId, classes }) for debugging
*/

export default "See classControllerRBAC.js, classRoutesRBAC.js, and ClassManagement.jsx for full implementation";
