import AuthProtected from "@/components/auth/AuthProtected";
import Navbar from "@/components/layout/Navbar";
import { RoleProvider } from "@/lib/context/RoleContext";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProtected>
      <RoleProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main>{children}</main>
        </div>
      </RoleProvider>
    </AuthProtected>
  );
}
