import { redirect } from "next/navigation";

export default async function Graph1RoutePage({
  searchParams,
}: {
  searchParams: Promise<{ fork?: string }>;
}) {
  const params = await searchParams;
  redirect(params.fork ? `/graph?fork=${params.fork}` : "/graph");
}
