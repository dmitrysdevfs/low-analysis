import { Suspense } from "react";
import { Layout } from "@/components/layout/Layout";
import { VerifyEmailScreen } from "@/components/auth/VerifyEmailScreen";

export default function VerifyEmailPage() {
  return (
    <Layout fullHeight>
      <Suspense>
        <VerifyEmailScreen />
      </Suspense>
    </Layout>
  );
}
