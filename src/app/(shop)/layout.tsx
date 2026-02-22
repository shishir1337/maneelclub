import { AnnouncementBar, Header, Footer, WhatsAppButton, MobileDock } from "@/components/layout";
import { getHeaderMenu, getAnnouncementSettings } from "@/lib/settings";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [navigation, announcement] = await Promise.all([
    getHeaderMenu(),
    getAnnouncementSettings(),
  ]);
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <AnnouncementBar
        enabled={announcement.enabled}
        message={announcement.message}
        link={announcement.link}
        linkText={announcement.linkText}
        countdownEnabled={announcement.countdownEnabled}
        countdownEnd={announcement.countdownEnd}
        countdownLabel={announcement.countdownLabel}
      />
      <Header navigation={navigation} />
      <main className="flex-1 pb-24 md:pb-0 overflow-x-hidden">{children}</main>
      <Footer />
      <WhatsAppButton />
      <MobileDock />
    </div>
  );
}
