// The single owner/admin of the app. Only this phone number gets full access
// (the admin panel / "profile" button). Everyone else is a normal user.
export const OWNER_PHONE = "+971552256963"

const ownerDigits = OWNER_PHONE.replace(/[^0-9]/g, "")

// True when the given phone number belongs to the owner. Comparison is done on
// digits only, so "+971552256963", "971552256963" and "00971552256963" all match.
export function isOwnerPhone(phone?: string | null): boolean {
  if (!phone) return false
  const d = phone.replace(/[^0-9]/g, "")
  if (!d) return false
  return d === ownerDigits || d.endsWith(ownerDigits)
}
