import AccessBoundary from "@/components/AccessBoundary"
export default function Settings() {
  return (
    <AccessBoundary
      permission="settings"
      title="Super Admin settings boundary"
    />
  )
}
