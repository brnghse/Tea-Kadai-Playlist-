"use client"

import React from "react"

interface VinylArtworkProps {
  isPlaying: boolean
}

export default function VinylArtwork({ isPlaying }: VinylArtworkProps) {
  return (
    <div className="relative select-none flex-shrink-0">
      {/* Outer Vinyl Circle */}
      <div
        className="w-[70px] h-[70px] sm:w-[90px] sm:h-[90px] rounded-full bg-zinc-900 flex items-center justify-center shadow-lg border border-zinc-950 transition-transform duration-300 relative overflow-hidden"
        style={{
          animation: "spin 8s linear infinite",
          animationPlayState: isPlaying ? "running" : "paused"
        }}
      >
        {/* Vinyl Grooves (Concentric Circles) */}
        <div className="absolute inset-2 rounded-full border border-zinc-800/60 pointer-events-none" />
        <div className="absolute inset-4 rounded-full border border-zinc-800/40 pointer-events-none" />
        <div className="absolute inset-6 rounded-full border border-zinc-800/30 pointer-events-none" />
        <div className="absolute inset-8 rounded-full border border-zinc-800/20 pointer-events-none" />

        {/* Center Paper Label */}
        <div className="w-[28px] h-[28px] sm:w-[36px] sm:h-[36px] rounded-full bg-tea-cream flex items-center justify-center border border-tea-charcoal/30 relative z-10">
          {/* Label design rings */}
          <div className="absolute inset-1 rounded-full border border-tea-accent/30" />
          <div className="absolute inset-[6px] rounded-full border border-tea-accent/50" />
          
          {/* Spindle Hole */}
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-tea-charcoal border border-tea-cream/40 shadow-inner z-20" />
        </div>
      </div>
    </div>
  )
}
