import Sidebar from "../components/ui/Sidebar";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-[#F5F5F7] font-sans overflow-hidden">
      {/* Menú lateral fijo */}
      <Sidebar />
      
      {/* Contenedor principal de las vistas */}
      <main className="flex-1 h-full overflow-y-auto">
        
        <div className="w-full h-full p-8">
          {children}
        </div>
      </main>
    </div>
  );
}