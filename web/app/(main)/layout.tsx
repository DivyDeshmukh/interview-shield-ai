import AuthProtected from "@/components/auth/AuthProtected";
import Navbar from "@/components/layout/Navbar";
import { RoleProvider } from "@/lib/context/RoleContext";
import { Toaster } from "react-hot-toast";

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
          <Toaster position="bottom-right" />
        </div>
      </RoleProvider>
    </AuthProtected>
  );
}
