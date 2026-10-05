import AuthScreen from "@/components/AuthScreen"
export default async function VerifyEmail({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  return <AuthScreen mode="verify-email" token={token || ""} />
}
