"use client"

import React, { useState, useMemo } from "react"
import { track as trackAnalytics } from "@vercel/analytics"
import { masterTracks, Track } from "../lib/tracks"
import TeaKadaiRadio from "../components/TeaKadaiRadio"
import GrainOverlay from "../components/GrainOverlay"

export default function Home() {
  // 1. Playback States
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)
  const [seekTo, setSeekTo] = useState<number | null>(null)
  
  // Track-specific playback errors
  const [trackErrors, setTrackErrors] = useState<Record<string, boolean>>({})

  // Total tracks in the master catalog
  const totalTracks = masterTracks.length

  // Current track metadata
  const currentTrack = useMemo<Track>(() => {
    return masterTracks[currentTrackIndex] || masterTracks[0]
  }, [currentTrackIndex])

  // Is current track unavailable
  const isUnavailable = useMemo(() => {
    const videoId = require("../lib/youtubeSources").getVideoIdForTrack(currentTrack.id)
    return !videoId || !!trackErrors[currentTrack.id]
  }, [currentTrack.id, trackErrors])

  // 2. Control Handlers
  const handlePlayPause = () => {
    if (isUnavailable) return
    const newState = !isPlaying
    setIsPlaying(newState)

    try {
      trackAnalytics(newState ? "song_play" : "song_pause", {
        trackId: currentTrack.id,
        trackTitle: currentTrack.title
      })
    } catch (e) {
      console.warn("Analytics error:", e)
    }
  }

  const handleNext = () => {
    let nextIndex = currentTrackIndex + 1
    if (nextIndex >= totalTracks) {
      nextIndex = 0
    }
    setCurrentTrackIndex(nextIndex)
    setCurrentTime(0)
    setDuration(0)

    try {
      trackAnalytics("song_next", {
        trackId: masterTracks[nextIndex]?.id,
        trackTitle: masterTracks[nextIndex]?.title
      })
    } catch (e) {
      console.warn("Analytics error:", e)
    }
  }

  const handlePrevious = () => {
    let prevIndex = currentTrackIndex - 1
    if (prevIndex < 0) {
      prevIndex = totalTracks - 1
    }
    setCurrentTrackIndex(prevIndex)
    setCurrentTime(0)
    setDuration(0)

    try {
      trackAnalytics("song_previous", {
        trackId: masterTracks[prevIndex]?.id,
        trackTitle: masterTracks[prevIndex]?.title
      })
    } catch (e) {
      console.warn("Analytics error:", e)
    }
  }

  const handleSeek = (time: number) => {
    if (isUnavailable) return
    setCurrentTime(time)
    setSeekTo(time)
  }

  const handlePlayerError = (errorCode: number) => {
    console.error(`Playback error ${errorCode} for video ID: ${currentTrack.id}`)
    setTrackErrors(prev => ({ ...prev, [currentTrack.id]: true }))
    setIsPlaying(false)

    try {
      trackAnalytics("youtube_error", {
        errorCode,
        trackId: currentTrack.id,
        trackTitle: currentTrack.title
      })
    } catch (e) {
      console.warn("Analytics error:", e)
    }

    // Auto advance to next song after 3 seconds warning
    setTimeout(() => {
      handleNext()
    }, 3000)
  }

  return (
    <main className="relative min-h-dvh w-full flex flex-col items-center z-10 pt-24 pb-8 overflow-y-auto">
      
      {/* Background Cover Artwork & Analog Grain */}
      <div className="hero-bg fixed inset-0 -z-20 bg-cover bg-center" />
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black/20 via-black/10 to-black/75" />
      <GrainOverlay />

      {/* Top Center Live online badge matching the reference image layout */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-40 flex items-center space-x-1.5 bg-black/40 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/5 shadow-lg select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-tea-cream/80 font-mono">
          187 online
        </span>
      </div>

      {/* Top Right Social links matching the reference image layout */}
      <div className="fixed top-5 right-5 z-40 flex items-center space-x-3.5 select-none bg-black/25 backdrop-blur-sm p-1.5 rounded-lg border border-white/5">
        <a 
          href="https://www.instagram.com/brnghse.studio/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-tea-cream/60 hover:text-tea-cream hover:scale-105 active:scale-95 transition-all duration-200 block"
          aria-label="Instagram Page"
        >
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
          </svg>
        </a>

        <a 
          href="https://www.linkedin.com/in/the-boring-house-studio-40b39a426/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-tea-cream/60 hover:text-tea-cream hover:scale-105 active:scale-95 transition-all duration-200 block"
          aria-label="LinkedIn Page"
        >
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
            <rect x="2" y="9" width="4" height="12"/>
            <circle cx="4" cy="4" r="2"/>
          </svg>
        </a>
      </div>

      {/* Center Area: Centered brand logo shifted upwards to avoid covering background face */}
      <div className="flex-shrink-0 flex items-center justify-center w-full max-w-4xl px-6 select-none mt-4 sm:mt-10 mb-8">
        <img
          src="/logo.png"
          alt="டீ கடை - Tea Kadai"
          className="w-[320px] sm:w-[520px] h-auto object-contain block drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]"
          loading="eager"
        />
      </div>

      {/* Bottom Area: Docked Physical Radio Player Console (Scrolls on short viewports) */}
      <div className="w-full max-w-[580px] px-4 flex justify-center mt-auto mb-2 z-30">
        <TeaKadaiRadio
          track={currentTrack}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          totalTracks={totalTracks}
          currentTrackIndex={currentTrackIndex}
          isUnavailable={isUnavailable}
          seekTo={seekTo}
          onPlayPause={handlePlayPause}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onSeek={handleSeek}
          onTimeUpdate={setCurrentTime}
          onDurationChange={setDuration}
          onPlayerError={handlePlayerError}
          clearSeek={() => setSeekTo(null)}
        />
      </div>

    </main>
  )
}
