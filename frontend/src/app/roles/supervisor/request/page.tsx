"use client";

import { Layout } from "@/components/layout/Layout";
import { LegislatorAccessRequestForm } from "@/features/law-change/components/LegislatorAccessRequestForm/LegislatorAccessRequestForm";
import { ROUTES } from "@/constants/routes";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SupervisorRequestPage() {
  return (
    <Layout>
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 16px",
          gap: 24,
        }}
      >
        <Link
          href={ROUTES.rolesSupervisor}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--color-smoke)",
            fontSize: "0.84rem",
            textDecoration: "none",
            alignSelf: "flex-start",
            maxWidth: 520,
            width: "100%",
          }}
        >
          <ArrowLeft size={14} />
          Про роль Супервізора
        </Link>

        <div style={{ width: "100%", maxWidth: 520 }}>
          <LegislatorAccessRequestForm defaultRole="supervisor" lockRole />
        </div>
      </div>
    </Layout>
  );
}
