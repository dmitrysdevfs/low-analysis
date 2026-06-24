import { FAQ_ADMIN } from "@/content/help/faq-admin";
import { AdminHelpCenterView } from "@/components/admin/AdminHelpCenterView";

export const metadata = { title: "Довідка адміна | Low Analysis" };

export default function AdminHelpPage() {
  return <AdminHelpCenterView items={FAQ_ADMIN} />;
}
