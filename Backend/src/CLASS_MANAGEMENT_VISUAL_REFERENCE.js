/**
 * VISUAL REFERENCE FOR CLASS MANAGEMENT RBAC
 * ==========================================
 * 
 * This file contains ASCII diagrams and visual references
 * for understanding the role-based class management system
 */

/**
 * ============================================
 * AUTHORIZATION FLOW DIAGRAM
 * ============================================
 */

const AUTHORIZATION_FLOW = `

REQUEST: POST /api/classes/create
         {name: "Class 10-A", ...}
                    │
                    ▼
        ┌─────────────────────┐
        │  protect middleware  │
        │  - Verify JWT token │
        │  - Get user from DB │
        │  - Set req.user     │
        └──────────┬──────────┘
                   │
                   ▼
        ┌────────────────────────────────┐
        │ authorize(['admin']) middleware │
        │ - Check role in ['admin']      │
        └──────────┬──────────┬──────────┘
                   │          │
              admin│          │teacher/student
                   │          │
        ┌──────────▼          ▼──────────────┐
        │ ✅ Continue         ❌ 403 Forbidden│
        │ to controller       {               │
        │                      message:       │
        │                      "Access denied"│
        │                     }              │
        └──────────┬──────────────────────────┘
                   │
                   ▼
        ┌────────────────────────┐
        │ createClass controller │
        │ - Validate input       │
        │ - Check duplicates     │
        │ - Create class         │
        │ - Log activity         │
        └──────────┬─────────────┘
                   │
                   ▼
        ┌────────────────────┐
        │ Response sent back │
        │ 201 Created        │
        └────────────────────┘

`;

/**
 * ============================================
 * ADMIN DASHBOARD LAYOUT
 * ============================================
 */

const ADMIN_DASHBOARD = `

┌───────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                            │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ ➕ CREATE NEW CLASS (Admin Only)                        │ │
│  │                                                         │ │
│  │ Class Name: ________________________________________  │ │
│  │ Academic Year: [Dropdown 2024-2025]                    │ │
│  │ Class Teacher: [Dropdown Select Teacher]               │ │
│  │ Capacity: _________________ (default: 40)              │ │
│  │                                                         │ │
│  │ [            CREATE CLASS            ]                 │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 📚 ALL CLASSES IN SYSTEM                                │ │
│  │ [Search Classes ________________] [Filter by Year]      │ │
│  │                                                         │ │
│  │  Class 10-A                                             │ │
│  │  Academic Year: 2024-2025                              │ │
│  │  Teacher: Mr. John Smith                               │ │
│  │  Students: 35 / 40                                      │ │
│  │  ████████░░ (87%)                                      │ │
│  │  [Edit] [Delete] [Manage Students]                      │ │
│  │                                                         │ │
│  │  Class 10-B                                             │ │
│  │  Academic Year: 2024-2025                              │ │
│  │  Teacher: Ms. Jane Doe                                 │ │
│  │  Students: 40 / 40                                      │ │
│  │  ██████████ (100% - FULL)                              │ │
│  │  [Edit] [Delete] [Manage Students]                      │ │
│  │                                                         │ │
│  │  Class 11-A                                             │ │
│  │  Academic Year: 2024-2025                              │ │
│  │  Teacher: Unassigned                                    │ │
│  │  Students: 28 / 40                                      │ │
│  │  ███████░░░░░░░ (70%)                                  │ │
│  │  [Edit] [Delete] [Manage Students]                      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ✅ ACTIONS VISIBLE:                                         │
│  • "Create New Class" form                                   │
│  • [Edit] button on each class                              │
│  • [Delete] button on each class                            │
│  • [Manage Students] button on each class                   │
│  • Search and filter                                        │
└───────────────────────────────────────────────────────────────┘

`;

/**
 * ============================================
 * TEACHER DASHBOARD LAYOUT
 * ============================================
 */

const TEACHER_DASHBOARD = `

┌───────────────────────────────────────────────────────────────┐
│                    TEACHER DASHBOARD                          │
│                    My Classes (2)                             │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Class 10-A (Academic Year: 2024-2025)                   │ │
│  │ 👨‍🏫 Teacher: Assigned to Me                              │ │
│  │ 👥 Students: 35 / 40                                     │ │
│  │ ████████░░ (87%)                                        │ │
│  │                                                         │ │
│  │ [        MANAGE STUDENTS        ]                        │ │
│  │                                                         │ │
│  │ • Add new students to class                              │ │
│  │ • Remove students from class                             │ │
│  │ • View student list                                      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Class 11-B (Academic Year: 2024-2025)                   │ │
│  │ 👨‍🏫 Teacher: Assigned to Me                              │ │
│  │ 👥 Students: 30 / 40                                     │ │
│  │ ███████░░░░░303 (75%)                                  │ │
│  │                                                         │ │
│  │ [        MANAGE STUDENTS        ]                        │ │
│  │                                                         │ │
│  │ • Add new students to class                              │ │
│  │ • Remove students from class                             │ │
│  │ • View student list                                      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ❌ NOT VISIBLE:                                             │
│  • "Create New Class" form                                   │ │
│  • [Edit] button                                            │
│  • [Delete] button                                          │
│  • Classes taught by other teachers                         │
│  • Search function                                          │
│  • Other classes from the system                            │
│                                                               │
│  ℹ️  Teachers only see classes they are assigned to teach   │
└───────────────────────────────────────────────────────────────┘

`;

/**
 * ============================================
 * STUDENT DASHBOARD LAYOUT
 * ============================================
 */

const STUDENT_DASHBOARD = `

┌───────────────────────────────────────────────────────────────┐
│                    STUDENT DASHBOARD                          │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   📚 MY CLASS                            │ │
│  │                                                         │ │
│  │             Class 10-A                                  │ │
│  │             Academic Year: 2024-2025                    │ │
│  │                                                         │ │
│  │  👨‍🏫 Teacher:                                            │ │
│  │     Mr. John Smith                                      │ │
│  │                                                         │ │
│  │  👥 Total Classmates: 34 students                       │ │
│  │     (Including you)                                     │ │
│  │                                                         │ │
│  │  📍 Status: Active                                      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │               👥 MY CLASSMATES (35)                      │ │
│  │                                                         │ │
│  │  ⊙ Alice Johnson       alice@school.com                 │ │
│  │  ⊙ Bob Williams        bob@school.com                   │ │
│  │  ⊙ Charlie Brown       charlie@school.com               │ │
│  │  ⊙ Diana Prince        diana@school.com                 │ │
│  │  ⊙ Emma Stone          emma@school.com                  │ │
│  │  ⊙ Frank Johnson       frank@school.com                 │ │
│  │  ⊙ Grace Lee           grace@school.com                 │ │
│  │  ⊙ Henry Davis         henry@school.com                 │ │
│  │  ⊙ Iris Chen           iris@school.com                  │ │
│  │  ├─ ... (25 more)                                       │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ❌ NOT VISIBLE / NOT ALLOWED:                               │ │
│  • "Create New Class" form                                   │ │
│  • Any [Edit] or [Delete] buttons                           │ │
│  • "Manage Students" option                                 │ │
│  • Other classes from the system                            │ │
│  • Students from other classes                              │ │
│  • Any action buttons                                       │ │
│  • Search or filter                                         │ │
│  • Edit class information                                   │ │
│                                                               │
│  ℹ️  Students can only view their own class and classmates  │
└───────────────────────────────────────────────────────────────┘

`;

/**
 * ============================================
 * DECISION TREE - WHO CAN DO WHAT
 * ============================================
 */

const DECISION_TREE = `

          START: User wants to manage classes
                          │
                          ▼
         ┌────────────────────────────┐
         │ What is the user's role?   │
         └────────┬────────┬──────────┘
                  │        │
             admin│ teacher│ student
                  │        │        │
          ┌───────▼        │        └──────────┐
          │                │                   │
    ┌─────▼──────────┐  │              ┌──────▼────────┐
    │ ADMIN               │              │ STUDENT        │
    ├────────────────┤  │              ├────────────────┤
    │ ✅ Create      │  │              │ ❌ Create      │
    │ ✅ View All    │  │              │ ✅ View Own    │
    │ ✅ Edit        │  │              │ ❌ Edit        │
    │ ✅ Delete      │  │              │ ❌ Delete      │
    │ ✅ Add Student │  │              │ ❌ Add Student │
    │ ✅ Remove Stud │  │              │ ✅ View Class  │
    └────────────────┘  │              │ ✅ See Friends │
                        │              └────────────────┘
                        │
                   ┌────▼──────────────┐
                   │ TEACHER            │
                   ├────────────────────┤
                   │ ❌ Create       403│
                   │ ✅ View Assigned   │
                   │ ❌ Edit         403│
                   │ ❌ Delete       403│
                   │ ✅ Add to Own   ✅│
                   │ ✅ Remove from  ✅│
                   │ ✅ View Stud Own✅│
                   │ ❌ Other Class 403│
                   └────────────────────┘

`;

/**
 * ============================================
 * ERROR RESPONSE EXAMPLES
 * ============================================
 */

const ERROR_RESPONSES = `

┌─────────────────────────────────────────────────────────────┐
│ 403 FORBIDDEN: When Teacher tries to create class            │
│                                                             │
│ REQUEST: POST /api/classes/create                          │
│ BODY: { name: "New Class", ... }                           │
│ HEADERS: { Authorization: Bearer <teacher_token> }         │
│                                                             │
│ RESPONSE:                                                   │
│ {                                                           │
│   "success": false,                                         │
│   "message": "Access denied. Your role 'teacher' is not    │
│              authorized for this action.",                 │
│   "userRole": "teacher",                                    │
│   "requiredRoles": ["admin"]                               │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 403 FORBIDDEN: When Teacher tries to access other classroom │
│                                                             │
│ REQUEST: GET /api/classes/other-teacher-class-id           │
│ HEADERS: { Authorization: Bearer <teacher_token> }         │
│                                                             │
│ RESPONSE:                                                   │
│ {                                                           │
│   "success": false,                                         │
│   "message": "You can only view your assigned classes"      │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 403 FORBIDDEN: When Student views other class               │
│                                                             │
│ REQUEST: GET /api/classes/other-student-class-id           │
│ HEADERS: { Authorization: Bearer <student_token> }         │
│                                                             │
│ RESPONSE:                                                   │
│ {                                                           │
│   "success": false,                                         │
│   "message": "You can only view your own class"             │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘

`;

/**
 * ============================================
 * SUCCESS RESPONSE EXAMPLES
 * ============================================
 */

const SUCCESS_RESPONSES = `

┌──────────────────────────────────────────────────────────────┐
│ 201 CREATED: Admin creates class                             │
│                                                              │
│ RESPONSE:                                                    │
│ {                                                            │
│   "success": true,                                           │
│   "message": "Class created successfully",                  │
│   "class": {                                                 │
│     "_id": "605c72ef1a1234567890abcd",                      │
│     "name": "Class 10-A",                                    │
│     "academicYear": {                                        │
│       "_id": "605c72ef1a1234567890def1",                    │
│       "name": "2024-2025"                                    │
│     },                                                       │
│     "classTeacher": {                                        │
│       "_id": "605c72ef1a1234567890ghi2",                    │
│       "name": "Mr. John Smith",                             │
│       "email": "john@school.com"                            │
│     },                                                       │
│     "students": [],                                          │
│     "capacity": 40,                                          │
│     "createdAt": "2024-04-07T10:30:00Z"                     │
│   }                                                          │
│ }                                                            │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ 200 OK: Teacher adds student to class                        │
│                                                              │
│ RESPONSE:                                                    │
│ {                                                            │
│   "success": true,                                           │
│   "message": "Student added to class successfully",          │
│   "class": {                                                 │
│     "_id": "605c72ef1a1234567890abcd",                      │
│     "name": "Class 10-A",                                    │
│     "students": [36 students - updated list],              │
│     "capacity": 40                                           │
│   }                                                          │
│ }                                                            │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ 200 OK: Get classes (role-based filtering)                   │
│                                                              │
│ AS ADMIN:                                                    │
│ {                                                            │
│   "success": true,                                           │
│   "count": 3,                                                │
│   "total": 3,                                                │
│   "page": 1,                                                 │
│   "pages": 1,                                                │
│   "userRole": "admin",                                       │
│   "classes": [                                               │
│     { class 10-A ... },                                      │
│     { class 10-B ... },                                      │
│     { class 11-A ... }                                       │
│   ]                                                          │
│ }                                                            │
│                                                              │
│ AS TEACHER:                                                  │
│ {                                                            │
│   "success": true,                                           │
│   "count": 2,                                                │
│   "total": 2,                                                │
│   "page": 1,                                                 │
│   "pages": 1,                                                │
│   "userRole": "teacher",                                     │
│   "classes": [                                               │
│     { class 10-A (where I'm teacher) ... },                │
│     { class 11-B (where I'm teacher) ... }                 │
│   ]                                                          │
│ }                                                            │
│                                                              │
│ AS STUDENT:                                                  │
│ {                                                            │
│   "success": true,                                           │
│   "count": 1,                                                │
│   "total": 1,                                                │
│   "page": 1,                                                 │
│   "pages": 1,                                                │
│   "userRole": "student",                                     │
│   "classes": [                                               │
│     { class 10-A (my class only) ... }                      │
│   ]                                                          │
│ }                                                            │
└──────────────────────────────────────────────────────────────┘

`;

/**
 * ============================================
 * BUTTON/COMPONENT VISIBILITY MATRIX
 * ============================================
 */

const VISIBILITY_MATRIX = `

                    ADMIN          TEACHER        STUDENT
┌──────────────────┬──────────────┬──────────────┬──────────────┐
│ Component        │              │              │              │
├──────────────────┼──────────────┼──────────────┼──────────────┤
│ Create Form      │ ✅ Visible   │ ❌ Hidden    │ ❌ Hidden    │
│ My Classes       │ ❌ Hidden    │ ✅ Visible   │ ❌ Hidden    │
│ My Class Card    │ ❌ Hidden    │ ❌ Hidden    │ ✅ Visible   │
│ [Edit] Button    │ ✅ Visible   │ ❌ Hidden    │ ❌ Hidden    │
│ [Delete] Button  │ ✅ Visible   │ ❌ Hidden    │ ❌ Hidden    │
│ [Manage Stud]    │ ✅ Visible   │ ✅ Own Only  │ ❌ Hidden    │
│ Search Box       │ ✅ Visible   │ ❌ Hidden    │ ❌ Hidden    │
│ Classmates List  │ ❌ Hidden    │ ❌ Hidden    │ ✅ Visible   │
│ Add Student      │ ✅ All       │ ✅ Own Only  │ ❌ Hidden    │
│ Remove Student   │ ✅ All       │ ✅ Own Only  │ ❌ Hidden    │
└──────────────────┴──────────────┴──────────────┴──────────────┘

`;

export const REFERENCE = {
  AUTHORIZATION_FLOW,
  ADMIN_DASHBOARD,
  TEACHER_DASHBOARD,
  STUDENT_DASHBOARD,
  DECISION_TREE,
  ERROR_RESPONSES,
  SUCCESS_RESPONSES,
  VISIBILITY_MATRIX,
};

export default REFERENCE;
