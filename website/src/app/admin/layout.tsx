import { redirect } from "next/navigation";
import { checkAdmin } from "@/lib/admin-auth";
import AdminSidebar from "./AdminSidebar";

export const metadata = {
  title: "Colage Admin",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await checkAdmin();
  if (!admin) {
    redirect("/ads");
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <AdminSidebar />
      <div className="md:ml-[260px]">
        <main className="min-h-screen p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
