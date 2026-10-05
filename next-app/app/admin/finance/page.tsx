import AccessBoundary from "@/components/AccessBoundary"
export default function Finance() {
  return (
    <AccessBoundary permission="payments" title="Finance permission boundary" />
  )
}
