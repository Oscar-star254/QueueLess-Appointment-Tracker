import AccessBoundary from "@/components/AccessBoundary"
export default function Moderation() {
  return (
    <AccessBoundary
      permission="moderation"
      title="Moderation permission boundary"
    />
  )
}
