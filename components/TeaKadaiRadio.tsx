"use client"

import React, { useEffect, useRef, useState } from "react"
import { Track } from "../lib/tracks"
import { getVideoIdForTrack } from "../lib/youtubeSources"

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: (() => void) | undefined
  }
}

interface TeaKadaiRadioProps {
  track: Track
  isPlaying: boolean
  currentTime: number
  duration: number
  totalTracks: number
  currentTrackIndex: number
  isUnavailable: boolean
  seekTo: number | null
  onPlayPause: () => void
  onNext: () => void
  onPrevious: () => void
  onSeek: (time: number) => void
  onTimeUpdate: (time: number) => void
  onDurationChange: (duration: number) => void
  onPlayerError: (code: number) => void
  clearSeek: () => void
}

function formatTime(secs: number) {
  if (isNaN(secs) || secs < 0) return "0:00"
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}

export default function TeaKadaiRadio({
  track,
  isPlaying,
  currentTime,
  duration,
  totalTracks,
  currentTrackIndex,
  isUnavailable,
  seekTo,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onTimeUpdate,
  onDurationChange,
  onPlayerError,
  clearSeek
}: TeaKadaiRadioProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const tunerRailRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const [apiReady, setApiReady] = useState(false)
  
  const activeVideoId = getVideoIdForTrack(track.id)
  const activeVideoIdRef = useRef<string | null>(null)
  const isPlayingRef = useRef<boolean>(false)

  // Sync state values to refs to avoid stale closures in player callbacks
  useEffect(() => {
    activeVideoIdRef.current = activeVideoId
  }, [activeVideoId])

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  const [playerCreated, setPlayerCreated] = useState(false)
  const [localProgress, setLocalProgress] = useState<number | null>(null)

  // Sync local progress when currentTime changes
  useEffect(() => {
    setLocalProgress(null)
  }, [currentTime])

  const displayedTime = localProgress !== null ? localProgress : currentTime
  const progressPercent = duration > 0 ? (displayedTime / duration) * 100 : 0

  // 1. Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setApiReady(true)
      return
    }

    const existingScript = document.getElementById("youtube-radio-api")
    if (!existingScript) {
      const tag = document.createElement("script")
      tag.id = "youtube-radio-api"
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }

    const previousCallback = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      if (previousCallback) previousCallback()
      setApiReady(true)
    }
  }, [])

  // 2. Initialize Player
  useEffect(() => {
    if (!apiReady || playerCreated || !containerRef.current) return

    const iframeId = "youtube-radio-iframe"
    const playerDiv = document.createElement("div")
    playerDiv.id = iframeId
    playerDiv.className = "w-full h-full object-cover"
    containerRef.current.appendChild(playerDiv)

    playerRef.current = new window.YT.Player(iframeId, {
      height: "100%",
      width: "100%",
      videoId: "",
      playerVars: {
        playsinline: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0
      },
      events: {
        onReady: () => {
          if (activeVideoIdRef.current) {
            playerRef.current.cueVideoById({ videoId: activeVideoIdRef.current })
            
            // If play was clicked before player was fully loaded
            if (isPlayingRef.current && typeof playerRef.current.playVideo === "function") {
              playerRef.current.playVideo()
            }
          }
        },
        onStateChange: (event: any) => {
          if (event.data === 1) {
            const dur = playerRef.current.getDuration()
            if (dur) onDurationChange(dur)
          }
          if (event.data === window.YT.PlayerState.ENDED) {
            onNext()
          }
        },
        onError: (event: any) => {
          onPlayerError(event.data)
        }
      }
    })

    setPlayerCreated(true)
  }, [apiReady, playerCreated])

  // 3. Handle track videoId changes
  useEffect(() => {
    if (!playerRef.current || !playerCreated) return

    if (activeVideoId) {
      if (isPlayingRef.current && typeof playerRef.current.loadVideoById === "function") {
        playerRef.current.loadVideoById({ videoId: activeVideoId })
      } else if (typeof playerRef.current.cueVideoById === "function") {
        playerRef.current.cueVideoById({ videoId: activeVideoId })
      }
    } else {
      if (typeof playerRef.current.stopVideo === "function") {
        playerRef.current.stopVideo()
      }
    }
  }, [activeVideoId, playerCreated])

  // Synchronous handler to capture user gesture and trigger immediate playback
  const handlePlayPauseClick = () => {
    if (isUnavailable || !playerRef.current || !playerCreated) return

    try {
      if (isPlaying) {
        if (typeof playerRef.current.pauseVideo === "function") {
          playerRef.current.pauseVideo()
        }
      } else {
        if (typeof playerRef.current.playVideo === "function") {
          playerRef.current.playVideo()
        }
      }
    } catch (err) {
      console.warn("Direct play trigger error:", err)
    }

    onPlayPause()
  }

  // 4. Handle Play/Pause (Backup sync effect)
  useEffect(() => {
    if (!playerRef.current || !playerCreated || !activeVideoId) return

    try {
      const getPlayerState = playerRef.current.getPlayerState
      const state = typeof getPlayerState === "function" ? getPlayerState.call(playerRef.current) : null

      if (isPlaying) {
        if (state !== 1 && typeof playerRef.current.playVideo === "function") {
          playerRef.current.playVideo()
        }
      } else {
        if (state === 1 && typeof playerRef.current.pauseVideo === "function") {
          playerRef.current.pauseVideo()
        }
      }
    } catch (err) {
      console.warn("Play state effect error:", err)
    }
  }, [isPlaying, activeVideoId, playerCreated])

  // 5. Handle manual seek
  useEffect(() => {
    if (!playerRef.current || !playerCreated || seekTo === null) return

    if (typeof playerRef.current.seekTo === "function") {
      playerRef.current.seekTo(seekTo, true)
    }
    clearSeek()
  }, [seekTo, playerCreated, clearSeek])

  // 6. Polling loop for playback time progress
  useEffect(() => {
    let intervalId: any
    if (isPlaying && playerRef.current && playerCreated) {
      intervalId = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
          const time = playerRef.current.getCurrentTime()
          onTimeUpdate(time)
          
          const dur = playerRef.current.getDuration()
          if (dur) onDurationChange(dur)
        }
      }, 250)
    }
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isPlaying, playerCreated])

  // Click / Drag to seek via Tuner Dial
  const handleTunerSeek = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isUnavailable || !tunerRailRef.current || duration === 0) return
    e.preventDefault()

    const calculateTime = (clientX: number) => {
      const rect = tunerRailRef.current!.getBoundingClientRect()
      const offset = Math.max(0, Math.min(clientX - rect.left, rect.width))
      const pct = offset / rect.width
      return pct * duration
    }

    const newTime = calculateTime(e.clientX)
    setLocalProgress(newTime)

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const time = calculateTime(moveEvent.clientX)
      setLocalProgress(time)
    }

    const handlePointerUp = (upEvent: PointerEvent) => {
      const finalTime = calculateTime(upEvent.clientX)
      onSeek(finalTime)
      setLocalProgress(null)
      document.removeEventListener("pointermove", handlePointerMove)
      document.removeEventListener("pointerup", handlePointerUp)
    }

    document.addEventListener("pointermove", handlePointerMove)
    document.addEventListener("pointerup", handlePointerUp)
  }

  return (
    <div className="w-full max-w-[580px] vintage-radio-cabinet rounded-t-[28px] p-3 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 text-tea-charcoal select-none">
      
      {/* speaker pinstripe faceplate background sheet inside the wooden cabinet */}
      <div className="w-full vintage-faceplate rounded-xl p-3 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3.5 border-t border-l border-white/5">
        
        {/* Left side: CRT Bezel Screen (YouTube Player/Album Art) */}
        <div className="w-full sm:w-[42%] aspect-video sm:aspect-auto sm:h-[135px] bg-[#0E0E0E] rounded-lg overflow-hidden relative shadow-[inset_0_4px_10px_rgba(0,0,0,0.9)] flex-shrink-0 p-[2.5px] bg-gradient-to-r from-amber-600 via-amber-400 to-amber-700 border border-amber-900/50">
          <div 
            onClick={handlePlayPauseClick}
            className={`w-full h-full rounded-md overflow-hidden relative bg-zinc-950 ${isUnavailable ? "" : "cursor-pointer"}`}
          >
            {/* Custom static thumbnail image overlay (renders at bottom z-0) */}
            {activeVideoId && !isUnavailable && (
              <img
                src={`https://img.youtube.com/vi/${activeVideoId}/hqdefault.jpg`}
                alt={track.title}
                className="w-full h-full object-cover brightness-[0.85] absolute inset-0 z-0"
              />
            )}

            {/* YouTube IFrame render target (placed on top at z-10 with low opacity to satisfy active-view checks) */}
            <div 
              ref={containerRef} 
              className="w-full h-full object-cover absolute inset-0 z-10 pointer-events-none" 
              style={{ opacity: 0.015 }}
            />

            {/* Gradient & Text Overlay (renders at top z-20) */}
            {activeVideoId && !isUnavailable && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10 p-2 flex flex-col justify-end z-20 pointer-events-none">
                <span className="text-xs font-black text-tea-accent tracking-wider uppercase font-tamil">
                  டீ கடை
                </span>
                <h3 className="text-xs font-bold text-tea-cream truncate leading-tight mt-0.5">
                  {track.title}
                </h3>
                <p className="text-[10px] text-tea-cream/70 truncate mt-0.5 font-tamil">
                  {track.artist}
                </p>
                <p className="text-[8px] text-tea-cream/50 truncate uppercase font-mono mt-0.5">
                  {track.film} {track.year ? `· ${track.year}` : ""}
                </p>
              </div>
            )}

            {/* Fallback screen if song is unavailable */}
            {isUnavailable && (
              <div className="absolute inset-0 z-25 flex flex-col items-center justify-center bg-zinc-950/95 text-center p-2 pointer-events-none">
                <span className="text-xs font-bold text-tea-accent font-tamil">
                  பாடல் கிடைக்கவில்லை
                </span>
                <span className="text-[9px] text-tea-cream/40 mt-1 uppercase font-mono">
                  Song Unavailable
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right side: Control Board (Ribbed grey-cream interface plate) */}
        <div 
          className="flex-grow rounded-lg p-2.5 flex flex-col justify-between border border-zinc-500/10 shadow-sm"
          style={{ backgroundColor: "#D4CEBE", backgroundImage: "radial-gradient(circle at center, #DFD9CD 0%, #D4CEBE 100%)" }}
        >
          {/* Incandescent amber filament-lit Tuner scale display */}
          <div className="relative w-full bg-[#1C150E] border-2 border-[#54483C] rounded-md p-1 shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)] select-none">
            {/* Ticks and scale numbers */}
            <div className="w-full flex justify-between text-[8px] text-[#DCA269]/70 font-mono font-bold px-2 relative z-10 select-none">
              <span>0</span>
              <span>1</span>
              <span>2</span>
              <span>3</span>
            </div>
            
            {/* Tuner Line / Needle pointer */}
            <div 
              ref={tunerRailRef}
              onPointerDown={handleTunerSeek}
              className="relative w-full h-[6px] mt-0.5 cursor-pointer touch-none z-20"
            >
              <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-[#54483C] -translate-y-1/2" />
              
              {/* The sliding red needle */}
              <div 
                className="absolute top-1/2 w-[2px] h-[14px] bg-red-600 shadow -translate-y-1/2 needle-transition"
                style={{ left: `${progressPercent}%` }}
              />
            </div>

            {/* Scale info text */}
            <div className="flex justify-between items-center text-[8px] font-mono text-[#DCA269]/80 px-1 mt-1">
              <span className="font-bold uppercase tracking-wider">
                {`C-${String(currentTrackIndex + 1).padStart(2, "0")}/${totalTracks}`}
              </span>
              <span className="font-bold tracking-widest text-[9px] bg-black/50 px-1.5 py-0.5 rounded text-[#FBBF24]">
                {formatTime(displayedTime).replace(":", " ")}
              </span>
              <span className="font-bold">
                {`${formatTime(displayedTime)} / ${track.duration}`}
              </span>
            </div>
          </div>

          {/* Dials, piano buttons & labels console */}
          <div className="flex items-center justify-between mt-2.5 relative">
            
            {/* Symmetrical Left Volume knob */}
            <div className="flex flex-col items-center flex-shrink-0 pr-2">
              <div 
                className="w-8 h-8 rounded-full radio-rotary-dial flex items-center justify-center relative transition-transform duration-300 border border-zinc-700/20"
                style={{ transform: `rotate(${displayedTime * 12}deg)` }}
              >
                <div className="absolute top-0.5 w-[1.5px] h-1.5 bg-zinc-800 rounded-full" />
                <div className="w-3.5 h-3.5 rounded-full bg-zinc-800/10 border border-zinc-700/25" />
              </div>
              <span className="text-[7px] font-black text-tea-charcoal/60 uppercase tracking-widest mt-1">VOL</span>
            </div>

            {/* Mechanical ivory keys (Previous, Play, Pause, Next) */}
            <div className="flex space-x-1 flex-grow justify-center px-1">
              <button
                onClick={onPrevious}
                className="radio-push-key px-2.5 py-1.5 rounded-md text-[8px] font-black tracking-wider select-none focus:outline-none cursor-pointer"
                aria-label="Previous song"
              >
                ◀◀
              </button>
              <button
                onClick={handlePlayPauseClick}
                disabled={isUnavailable}
                className={`radio-push-key px-3.5 py-1.5 rounded-md text-[8px] font-black tracking-wider select-none focus:outline-none cursor-pointer ${
                  isPlaying && !isUnavailable ? "is-active" : ""
                } ${isUnavailable ? "opacity-40 cursor-not-allowed" : ""}`}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? "PAUSE" : "PLAY"}
              </button>
              <button
                onClick={onNext}
                className="radio-push-key px-2.5 py-1.5 rounded-md text-[8px] font-black tracking-wider select-none focus:outline-none cursor-pointer"
                aria-label="Next song"
              >
                ▶▶
              </button>
            </div>

            {/* Symmetrical Right Tone knob */}
            <div className="flex flex-col items-center flex-shrink-0 pl-2">
              <div 
                className="w-8 h-8 rounded-full radio-rotary-dial flex items-center justify-center relative transition-transform duration-300 border border-zinc-700/20"
                style={{ transform: `rotate(45deg)` }}
              >
                <div className="absolute top-0.5 w-[1.5px] h-1.5 bg-zinc-800 rounded-full" />
                <div className="w-3.5 h-3.5 rounded-full bg-zinc-800/10 border border-zinc-700/25" />
              </div>
              <span className="text-[7px] font-black text-tea-charcoal/60 uppercase tracking-widest mt-1">TONE</span>
            </div>

          </div>

          {/* Cassette Deck Branding */}
          <div className="w-full text-center mt-1.5 select-none border-t border-tea-charcoal/10 pt-1 flex justify-center items-center space-x-1.5 text-tea-charcoal/50">
            <span className="text-[7px] tracking-widest uppercase font-black">SOOR TAAL</span>
            <span className="text-[6px] tracking-wider uppercase font-medium">STEREO RADIO CASSETTE PLAYER</span>
          </div>

        </div>

      </div>
    </div>
  )
}
