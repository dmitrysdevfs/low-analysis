import { Suspense } from "react";
import { Layout } from "@/components/layout/Layout";
import { ForgotPasswordScreen } from "@/components/auth/ForgotPasswordScreen";

export default function ForgotPasswordPage() {
  return (
    <Layout fullHeight>
      <Suspense>
        <ForgotPasswordScreen />
      </Suspense>
    </Layout>
  );
}
