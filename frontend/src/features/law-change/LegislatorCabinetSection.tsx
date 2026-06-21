"use client";

import { LegislatorAccessRequestForm } from "./components/LegislatorAccessRequestForm/LegislatorAccessRequestForm";
import { MyProposalsList } from "./components/MyProposalsList/MyProposalsList";

interface LegislatorCabinetSectionProps {
  isLegislator: boolean;
  isSupervisor: boolean;
}

export function LegislatorCabinetSection({
  isLegislator,
  isSupervisor,
}: LegislatorCabinetSectionProps) {
  if (isLegislator) {
    return (
      <section>
        <MyProposalsList />
      </section>
    );
  }

  if (isSupervisor) {
    return (
      <section>
        <MyProposalsList />
      </section>
    );
  }

  return (
    <section>
      <LegislatorAccessRequestForm />
    </section>
  );
}
