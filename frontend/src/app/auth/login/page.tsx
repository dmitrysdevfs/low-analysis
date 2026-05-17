import { Suspense } from "react";
import { Layout } from "@/components/Layout";
import { AuthFormScreen } from "@/components/auth/AuthFormScreen";

export default function LoginPage() {
  return (
    <Layout fullHeight>
      <Suspense>
        <AuthFormScreen mode="login" />
      </Suspense>
    </Layout>
  );
}
