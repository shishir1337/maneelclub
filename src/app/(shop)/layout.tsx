import { AnnouncementBar, Header, Footer, WhatsAppButton, MobileDock } from "@/components/layout";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <AnnouncementBar />
      <Header />
      <main className="flex-1 pb-24 md:pb-0 overflow-x-hidden">{children}</main>
      <Footer />
      <WhatsAppButton />
      <MobileDock />
    </div>
  );
}
