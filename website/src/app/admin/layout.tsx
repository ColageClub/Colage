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
    <div style={{ minHeight: "100vh", background: "#0A0A0A" }}>
      <AdminSidebar />
      <main style={{ minHeight: "100vh", marginLeft: 260, padding: "32px" }} className="admin-main">
        {children}
      </main>
      <style>{`
        @media (max-width: 767px) {
          .admin-main { margin-left: 0 !important; padding: 24px !important; }
        }
      `}</style>
    </div>
  );
}
