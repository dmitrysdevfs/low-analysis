import { Layout } from "@/components/layout/Layout";
import { ClientWorkspaceNotes } from "@/components/account/ClientWorkspaceNotes";

export default function AccountNotesPage() {
  return (
    <Layout fullHeight>
      <ClientWorkspaceNotes />
    </Layout>
  );
}
