import { Layout } from "@/components/layout/Layout";
import { ClientBillingOverview } from "@/components/account/ClientBillingOverview";

export default function AccountBillingPage() {
  return (
    <Layout fullHeight>
      <ClientBillingOverview />
    </Layout>
  );
}
