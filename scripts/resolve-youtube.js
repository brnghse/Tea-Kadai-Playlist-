const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

const SOURCE_FILE = path.join(__dirname, "..", "tracks-source.json")
const OUTPUT_FILE = path.join(__dirname, "..", "lib", "youtubeSources.ts")

// Helper to check if yt-dlp is installed
function checkYtDlp() {
  try {
    execSync("yt-dlp --version", { stdio: "ignore" })
    return true
  } catch (e) {
    return false
  }
}

function run() {
  console.log("=== YouTube Video ID Resolver ===")

  // 1. Check for tracks-source.json. If missing, create a template.
  if (!fs.existsSync(SOURCE_FILE)) {
    console.log(`Source file not found. Creating a template at: ${SOURCE_FILE}`)
    const template = [
      {
        id: "valaiyosai",
        title: "Valaiyosai",
        youtubeUrl: "https://www.youtube.com/watch?v=pGGR83JRZzc"
      },
      {
        id: "kanne-kalaimaane",
        title: "Kanne Kalaimaane",
        youtubeUrl: "https://www.youtube.com/watch?v=333o6-x19gA"
      }
    ]
    fs.writeFileSync(SOURCE_FILE, JSON.stringify(template, null, 2), "utf8")
    console.log("Please populate tracks-source.json with approved URLs, then re-run this script.")
    return
  }

  // 2. Check for yt-dlp installation
  if (!checkYtDlp()) {
    console.error("Error: yt-dlp is not installed or not found in system PATH.")
    console.error("Please install yt-dlp: https://github.com/yt-dlp/yt-dlp#installation")
    return
  }

  console.log(`Reading approved sources from: ${SOURCE_FILE}`)
  const sources = JSON.parse(fs.readFileSync(SOURCE_FILE, "utf8"))
  const results = {}

  // 3. Resolve each URL using yt-dlp
  for (const item of sources) {
    if (!item.id || !item.youtubeUrl) {
      console.warn(`Skipping invalid item: ${JSON.stringify(item)}`)
      continue
    }

    console.log(`Resolving: ${item.title || item.id} -> ${item.youtubeUrl}`)
    try {
      // Execute yt-dlp to get the 11-character video ID
      const videoId = execSync(`yt-dlp --get-id "${item.youtubeUrl}"`, {
        encoding: "utf8",
        timeout: 10000 // 10s timeout per URL
      }).trim()

      if (videoId && videoId.length === 11) {
        results[item.id] = videoId
        console.log(`  ✓ Success: ${videoId}`)
      } else {
        console.warn(`  ⚠️ Warning: Resolved ID has unexpected format: "${videoId}"`)
        results[item.id] = null
      }
    } catch (error) {
      console.error(`  ✗ Error resolving URL: ${error.message.trim()}`)
      results[item.id] = null
    }
  }

  // 4. Read current youtubeSources.ts if exists to merge new resolutions
  let existingMappings = {}
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      const content = fs.readFileSync(OUTPUT_FILE, "utf8")
      // Quick regex match to extract current mappings
      const regex = /"([^"]+)":\s*(?:"([^"]+)"|null)/g
      let match
      while ((match = regex.exec(content)) !== null) {
        existingMappings[match[1]] = match[2] || null
      }
    } catch (e) {
      console.warn("Could not parse existing mappings, overwriting file.")
    }
  }

  const finalMappings = { ...existingMappings, ...results }

  // 5. Generate and write the output TS file
  const tsContent = `export const youtubeSources: Record<string, string | null> = {
${Object.entries(finalMappings)
  .map(([id, videoId]) => `  "${id}": ${videoId ? `"${videoId}"` : "null"}`)
  .join(",\n")}
}

export function getVideoIdForTrack(trackId: string): string | null {
  return youtubeSources[trackId] || null
}
`

  fs.writeFileSync(OUTPUT_FILE, tsContent, "utf8")
  console.log(`\n✓ Success! Wrote updated mappings to: ${OUTPUT_FILE}`)
}

run()
