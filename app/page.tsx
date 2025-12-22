import { MharmyrauxPortal } from "@/components/mharmyraux-portal"
import { JsonLd } from "@/components/json-ld"

export const revalidate = 60

export default function Home() {
  return (
    <>
      <JsonLd soulsOnline={12847} pageType="home" />
      <MharmyrauxPortal />
    </>
  )
}
