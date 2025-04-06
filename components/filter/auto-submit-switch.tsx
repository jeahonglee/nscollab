"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useTransition } from "react"

interface AutoSubmitSwitchProps {
  id: string
  label: string
  paramName: string
  defaultChecked?: boolean
}

export function AutoSubmitSwitch({ 
  id, 
  label, 
  paramName, 
  defaultChecked = false 
}: AutoSubmitSwitchProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handleChange = (checked: boolean) => {
    startTransition(() => {
      // Create a new URLSearchParams object
      const params = new URLSearchParams(searchParams.toString())
      
      // Add or remove the parameter based on the switch state
      if (checked) {
        params.set(paramName, 'true')
      } else {
        params.delete(paramName)
      }
      
      // Push the new URL with updated search params
      router.push(`${pathname}?${params.toString()}`)
    })
  }
  
  return (
    <div className="flex items-center gap-2">
      <Switch 
        id={id}
        checked={defaultChecked}
        onCheckedChange={handleChange}
        disabled={isPending}
      />
      <Label htmlFor={id}>{label}</Label>
    </div>
  )
}
