import { useState } from "react";
import UniversalUserForm from "@/components/auth/UniversalUserForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { UserPlus, GraduationCap, Users, ShieldCheck, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const roleCards = [
  { id: "student", name: "Student", icon: GraduationCap, color: "text-blue-500", bg: "bg-blue-50/50" },
  { id: "teacher", name: "Teacher", icon: Users, icon2: UserPlus, color: "text-emerald-500", bg: "bg-emerald-50/50" },
  { id: "parent", name: "Parent", icon: UserCircle, color: "text-orange-500", bg: "bg-orange-50/50" },
  { id: "admin", name: "Admin", icon: ShieldCheck, color: "text-purple-500", bg: "bg-purple-50/50" },
];

const AddUser = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState("student");

  const handleSuccess = () => {
    toast.success(`${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} added successfully!`);
    navigate(`/dashboard/users/${selectedRole}s`);
  };

  return (
    <div className="min-h-full p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
          User Management
        </h1>
        <p className="text-muted-foreground">
          Create and board new members to the Learnsphere community.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Role Selection Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="grid gap-4">
            {roleCards.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={cn(
                  "group relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left hover:shadow-md",
                  selectedRole === role.id
                    ? "bg-white dark:bg-gray-800 border-primary ring-2 ring-primary/10 shadow-sm"
                    : "bg-gray-50/50 dark:bg-gray-900/50 border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                )}
              >
                <div className={cn("p-2 rounded-lg transition-colors", role.bg, role.color)}>
                  <role.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{role.name}</h3>
                  <p className="text-xs text-muted-foreground leading-tight">
                    Add new {role.id} to system
                  </p>
                </div>
                {selectedRole === role.id && (
                  <div className="absolute right-4 w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
              </button>
            ))}
          </div>

          <div className="p-6 rounded-2xl bg-linear-to-br from-primary/5 to-transparent border border-primary/10">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Security Notice
            </h4>
            <p className="text-xs text-muted-foreground">
              New users will be set to "Approved" status by default when created via this management panel.
            </p>
          </div>
        </div>

        {/* Main Form Area */}
        <Card className="lg:col-span-8 overflow-hidden border-none shadow-2xl dark:shadow-primary/5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 via-primary to-purple-500" />
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <UserPlus className="w-5 h-5" />
              </div>
              <CardTitle>Registering New {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}</CardTitle>
            </div>
            <CardDescription>
              Please fill in the required information below to create the account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UniversalUserForm type="create" role={selectedRole} onSuccess={handleSuccess} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddUser;
