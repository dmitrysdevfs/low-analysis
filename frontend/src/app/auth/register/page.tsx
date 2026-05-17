import { Suspense } from "react";
import { Layout } from "@/components/Layout";
import { AuthFormScreen } from "@/components/auth/AuthFormScreen";

export default function RegisterPage() {
  return (
    <Layout fullHeight>
      <Suspense>
        <AuthFormScreen mode="register" />
      </Suspense>
    </Layout>
  );
}
