import { Suspense } from "react";
import { InvitePage } from "./InvitePage";

export default function InviteGroupPage() {
  return (
    <Suspense>
      <InvitePage />
    </Suspense>
  );
}
