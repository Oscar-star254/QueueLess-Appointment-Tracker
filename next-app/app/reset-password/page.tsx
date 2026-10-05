import AuthScreen from "@/components/AuthScreen"
export default async function ResetPassword({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  return <AuthScreen mode="new-password" token={token || ""} />
}
