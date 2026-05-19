import { Suspense } from "react";
import { Layout } from "@/components/layout/Layout";
import { AuthFormScreen } from "@/components/auth/AuthFormScreen";

export default function AuthPage() {
  return (
    <Layout fullHeight>
      <Suspense>
        <AuthFormScreen mode="login" />
      </Suspense>
    </Layout>
  );
}
