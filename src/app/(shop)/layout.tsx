import { AnnouncementBar, Header, Footer, WhatsAppButton, MobileDock } from "@/components/layout";
import { getHeaderMenu } from "@/lib/settings";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigation = await getHeaderMenu();
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <AnnouncementBar />
      <Header navigation={navigation} />
      <main className="flex-1 pb-24 md:pb-0 overflow-x-hidden">{children}</main>
      <Footer />
      <WhatsAppButton />
      <MobileDock />
    </div>
  );
}
