import { Suspense } from "react";
import { CheckoutDashboard } from "@/features/account1/CheckoutDashboard";

export const metadata = {
  title: "Оформлення плану · Law Analysis",
};

export default function Checkout1Page() {
  return (
    <Suspense>
      <CheckoutDashboard />
    </Suspense>
  );
}
