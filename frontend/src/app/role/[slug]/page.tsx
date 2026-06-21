import { notFound, redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

const ROLE_ROUTE_MAP: Record<string, string> = {
  guest: ROUTES.rolesGuest,
  user: ROUTES.rolesUser,
  lawmaker: ROUTES.rolesLawmaker,
  legislator: ROUTES.rolesLawmaker,
  supervisor: ROUTES.rolesSupervisor,
  admin: ROUTES.rolesAdmin,
};

export default async function RoleAliasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const target = ROLE_ROUTE_MAP[slug];

  if (!target) {
    notFound();
  }

  redirect(target);
}
