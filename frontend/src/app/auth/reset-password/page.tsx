import { Suspense } from "react";
import { Layout } from "@/components/layout/Layout";
import { ResetPasswordScreen } from "@/components/auth/ResetPasswordScreen";

export default function ResetPasswordPage() {
  return (
    <Layout fullHeight>
      <Suspense>
        <ResetPasswordScreen />
      </Suspense>
    </Layout>
  );
}
