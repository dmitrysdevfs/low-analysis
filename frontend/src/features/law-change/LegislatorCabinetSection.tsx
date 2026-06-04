"use client";

import { LegislatorAccessRequestForm } from "./components/LegislatorAccessRequestForm/LegislatorAccessRequestForm";
import { MyProposalsList } from "./components/MyProposalsList/MyProposalsList";

interface LegislatorCabinetSectionProps {
  isLegislator: boolean;
}

export function LegislatorCabinetSection({
  isLegislator,
}: LegislatorCabinetSectionProps) {
  return (
    <>
      {isLegislator ? (
        <section>
          <MyProposalsList />
        </section>
      ) : (
        <section>
          <LegislatorAccessRequestForm />
        </section>
      )}
    </>
  );
}
