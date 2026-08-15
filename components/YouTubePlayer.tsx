"use client"

import React, { useEffect, useRef, useState } from "react"

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: (() => void) | undefined
  }
}

interface YouTubePlayerProps {
  videoId: string | null
  isPlaying: boolean
  seekTo: number | null
  onStateChange: (state: number) => void
  onTimeUpdate: (time: number) => void
  onDurationChange: (duration: number) => void
  onError: (errorCode: number) => void
  onReady: () => void
  clearSeek: () => void
}

export default function YouTubePlayer({
  videoId,
  isPlaying,
  seekTo,
  onStateChange,
  onTimeUpdate,
  onDurationChange,
  onError,
  onReady,
  clearSeek
}: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const [apiReady, setApiReady] = useState(false)
  const [playerCreated, setPlayerCreated] = useState(false)

  // 1. Load YouTube IFrame API script
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setApiReady(true)
      return
    }

    // Check if script already injected
    const existingScript = document.getElementById("youtube-iframe-api")
    if (!existingScript) {
      const tag = document.createElement("script")
      tag.id = "youtube-iframe-api"
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }

    const previousCallback = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      if (previousCallback) previousCallback()
      setApiReady(true)
    }

    return () => {
      // Keep the global callback but clean up local references if needed
    }
  }, [])

  // 2. Initialize Player once API is ready
  useEffect(() => {
    if (!apiReady || playerCreated || !containerRef.current) return

    const iframeId = "youtube-player-iframe"
    const playerDiv = document.createElement("div")
    playerDiv.id = iframeId
    playerDiv.className = "w-full h-full aspect-video rounded-md"
    containerRef.current.appendChild(playerDiv)

    playerRef.current = new window.YT.Player(iframeId, {
      height: "100%",
      width: "100%",
      videoId: videoId || "",
      playerVars: {
        playsinline: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        origin: typeof window !== "undefined" ? window.location.origin : ""
      },
      events: {
        onReady: () => {
          onReady()
          // If videoId was ready, play it if needed
          if (videoId && typeof playerRef.current?.cueVideoById === "function") {
            playerRef.current.cueVideoById({ videoId })
          }
        },
        onStateChange: (event: any) => {
          onStateChange(event.data)
          // Capture duration when playing starts
          if (event.data === window.YT.PlayerState.PLAYING) {
            if (typeof playerRef.current?.getDuration === "function") {
              const dur = playerRef.current.getDuration()
              if (dur) onDurationChange(dur)
            }
          }
        },
        onError: (event: any) => {
          onError(event.data)
        }
      }
    })

    setPlayerCreated(true)
  }, [apiReady, playerCreated, onReady, onStateChange, onDurationChange, onError])

  // 3. Handle videoId changes
  useEffect(() => {
    if (!playerRef.current || !playerCreated) return

    if (videoId) {
      // Cue or load video based on autoplay requirements
      if (typeof playerRef.current.cueVideoById === "function") {
        playerRef.current.cueVideoById({ videoId })
      }
      // If we were playing, load and play
      if (isPlaying && typeof playerRef.current.loadVideoById === "function") {
        playerRef.current.loadVideoById({ videoId })
      }
    } else {
      if (typeof playerRef.current.stopVideo === "function") {
        playerRef.current.stopVideo()
      }
    }
  }, [videoId, isPlaying, playerCreated])

  // 4. Handle Play/Pause toggling
  useEffect(() => {
    if (!playerRef.current || !playerCreated || !videoId) return

    const getPlayerState = playerRef.current.getPlayerState
    const state = typeof getPlayerState === "function" ? getPlayerState.call(playerRef.current) : null
    
    if (isPlaying) {
      if (state !== window.YT.PlayerState.PLAYING) {
        // If it was cued or stopped, load it
        if (state === window.YT.PlayerState.CUED || state === -1) {
          if (typeof playerRef.current.loadVideoById === "function") {
            playerRef.current.loadVideoById({ videoId })
          }
        } else {
          if (typeof playerRef.current.playVideo === "function") {
            playerRef.current.playVideo()
          }
        }
      }
    } else {
      if (state === window.YT.PlayerState.PLAYING) {
        if (typeof playerRef.current.pauseVideo === "function") {
          playerRef.current.pauseVideo()
        }
      }
    }
  }, [isPlaying, videoId, playerCreated])

  // 5. Handle manual Seek events
  useEffect(() => {
    if (!playerRef.current || !playerCreated || seekTo === null) return

    if (typeof playerRef.current.seekTo === "function") {
      playerRef.current.seekTo(seekTo, true)
    }
    clearSeek()
  }, [seekTo, playerCreated, clearSeek])

  // 6. Polling loop for tracking time progress
  useEffect(() => {
    let intervalId: any
    if (isPlaying && playerRef.current && playerCreated) {
      intervalId = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
          const time = playerRef.current.getCurrentTime()
          onTimeUpdate(time)
          
          // Double check duration
          const dur = playerRef.current.getDuration()
          if (dur) onDurationChange(dur)
        }
      }, 250)
    }
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isPlaying, playerCreated, onTimeUpdate, onDurationChange])

  return (
    <div className="flex flex-col items-center p-3 vintage-board rounded-2xl border border-tea-border song-board-shadow max-w-[200px] w-full">
      <div className="w-full flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-tea-accent font-bold">
          📺 TEA KADAI TV
        </span>
        <div className="flex space-x-1 items-center">
          <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
          <span className="text-[9px] text-tea-cream/50 uppercase">
            {isPlaying ? "ON AIR" : "STDBY"}
          </span>
        </div>
      </div>

      <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black border border-tea-border/30">
        {/* IFrame mount point */}
        <div ref={containerRef} className="w-full h-full" />

        {/* TV Off / Static Screen Placeholder */}
        {(!videoId || !isPlaying) && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90 text-center p-2 pointer-events-none">
            <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-tea-cream via-tea-charcoal to-black" />
            
            {/* Retro test pattern / static lines */}
            <div className="w-full flex justify-around opacity-20 h-4 mb-2">
              <div className="w-2 bg-red-600 h-full" />
              <div className="w-2 bg-yellow-600 h-full" />
              <div className="w-2 bg-blue-600 h-full" />
              <div className="w-2 bg-green-600 h-full" />
              <div className="w-2 bg-purple-600 h-full" />
              <div className="w-2 bg-teal-600 h-full" />
            </div>

            <span className="text-[10px] font-medium tracking-wide text-tea-cream/40 font-tamil">
              {!videoId ? "பாடல் இல்லை" : "டிவி காத்திருப்பு"}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
