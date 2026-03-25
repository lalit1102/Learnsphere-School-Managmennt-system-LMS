import { Card } from "@/components/ui/card";

export default function Dashboard() {
  return (
    <div className="p-6 grid grid-cols-3 gap-6">
      <Card className="p-4">Total Students</Card>
      <Card className="p-4">Total Teachers</Card>
      <Card className="p-4">Total Parents</Card>
    </div>
  );
}