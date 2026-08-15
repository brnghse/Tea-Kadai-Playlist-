"use client"

import React, { useState, useEffect } from "react"

export default function Clock() {
  const [timeStr, setTimeStr] = useState<string>("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const updateClock = () => {
      const now = new Date()
      const formatted = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      }).format(now)
      setTimeStr(formatted)
    }

    updateClock()
    const interval = setInterval(updateClock, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!mounted || !timeStr) {
    return (
      <span className="inline-flex items-center text-sm font-medium tracking-wide text-tea-cream/40">
        --:-- --
      </span>
    )
  }

  // Split formatted time to blink the colon
  // Example formatted: "10:46 AM" or "10:46 am"
  const colonIndex = timeStr.indexOf(":")
  if (colonIndex === -1) {
    return (
      <span className="text-sm font-medium tracking-wide text-tea-cream/80 select-none">
        {timeStr}
      </span>
    )
  }

  const hours = timeStr.slice(0, colonIndex)
  const minutesAndAmpm = timeStr.slice(colonIndex + 1)

  return (
    <span className="text-sm font-medium tracking-wide text-tea-cream/90 select-none font-mono">
      <span>{hours}</span>
      <span className="animate-blink inline-block px-[1px] text-tea-accent font-bold">:</span>
      <span>{minutesAndAmpm}</span>
    </span>
  )
}
