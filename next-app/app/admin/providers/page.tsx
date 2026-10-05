import AccessBoundary from "@/components/AccessBoundary"
export default function Providers() {
  return (
    <AccessBoundary
      permission="providers"
      title="Provider management boundary"
    />
  )
}
