import { ApiCenterView, getApiCenterPayload } from "@/features/api-center";

export const dynamic = "force-dynamic";

export default async function AdminApiCenterPage() {
  const payload = await getApiCenterPayload();

  return <ApiCenterView payload={payload} />;
}
