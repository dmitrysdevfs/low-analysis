import { Suspense } from "react";
import { CheckoutDashboard } from "@/features/account1/CheckoutDashboard";

export default function AccountBillingCheckoutPage() {
  return (
    <Suspense>
      <CheckoutDashboard />
    </Suspense>
  );
}
