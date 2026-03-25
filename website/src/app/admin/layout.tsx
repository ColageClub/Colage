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
    <div className="min-h-screen bg-[#0A0A0A] flex">
      <AdminSidebar />
      <main className="flex-1 md:ml-[260px] p-6 md:p-8 overflow-y-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}
