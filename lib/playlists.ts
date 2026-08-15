import { Track, masterTracks } from "./tracks"

export type Playlist = {
  id: string
  name: string
  tamilName: string
  description: string
  trackIds: string[]
}

export const playlists: Playlist[] = [
  {
    id: "kaadhal",
    name: "Tea Kadai — Kaadhal",
    tamilName: "டீ கடை — காதல்",
    description: "Romantic, soothing, and nostalgic Tamil melodies.",
    trackIds: [
      "kaattrae-en-vaasal",
      "enna-solla-pogirai",
      "kaadhal-kaditham",
      "enakke-enakkaa",
      "pachai-nirame",
      "sotta-sotta",
      "yedho-ondru",
      "mun-paniya",
      "enna-vilai",
      "poovukkul",
      "poongatrile",
      "azhagana-ratchasiye",
      "kannoodu-kaanbathalam",
      "melliname",
      "kurukku-siruthavale",
      "anbae-anbae",
      "kandukondain-kandukondain",
      "merke-merke",
      "minnalai-pidithu",
      "mudher-kanave",
      "enakkoru-snehidhi",
      "june-july",
      "ennavale-adi-ennavale",
      "ennavale-ennavale",
      "asai-asai",
      "roja-roja",
      "netru-illatha-maatram",
      "chudithar-aninthu",
      "ennai-thalatta-varuvala",
      "mayilirage",
      "azhagooril",
      "ale-ale",
      "mottukkale",
      "malare-oru-varthai",
      "siruthooral",
      "raaja-raaja-chozhan",
      "kalyaana-thaen-nila",
      "panivizhum-iravu",
      "ilaya-nila-pozhigirathe",
      "sundari",
      "valaiyosai"
    ]
  },
  {
    id: "ninaivugal",
    name: "Tea Kadai — Ninaivugal",
    tamilName: "டீ கடை — நினைவுகள்",
    description: "Emotional, pathos, reflective, and late-night nostalgia.",
    trackIds: [
      "nenjinile",
      "nadhiyae-nadhiyae",
      "meghamai-vanthu-pogiren",
      "oru-thuli",
      "rosappu-chinna-rosappu",
      "oru-poiyavathu",
      "nila-kaigiradhu",
      "yenna-azhago",
      "pottu-vaitha-oru-vatta-nila",
      "thendral-vandhu-theendum-pothu",
      "ilamai-ennum-poonkaatru",
      "nilaave-vaa",
      "kanne-kalaimaane",
      "rasathi-unnai",
      "thenpandi-cheemayile",
      "antha-vanatha",
      "malaiyoram-veesum-kaathu",
      "nila-adhu-vanathumele"
    ]
  },
  {
    id: "pazhaya-paattu",
    name: "Tea Kadai — Pazhaya Paattu",
    tamilName: "டீ கடை — பழைய பாட்டு",
    description: "Classic Ilaiyaraaja, folk, classical, and energetic vintage tracks.",
    trackIds: [
      "sarakku-vachiruken",
      "vaadiamma",
      "thayya-thayya",
      "oru-ponnu-onnu",
      "mukkala-mukkabla",
      "appadipodu",
      "sinthamani-sinthamani",
      "vaadi-vaadi-naattu-katta",
      "varaaha-nadhi",
      "penn-kiliye-penn-kiliye",
      "vaadi-vaadi",
      "sivappu-lolakku",
      "azhagana-chinna-devathai",
      "aagaasa-nilavu",
      "innisai-paadivarum",
      "columbus-columbus",
      "pottu-vaitha-oru-vatta-nila",
      "raaja-raaja-chozhan",
      "thendral-vandhu-theendum-pothu",
      "ilamai-ennum-poonkaatru",
      "nilaave-vaa",
      "kanne-kalaimaane",
      "rasathi-unnai",
      "thenpandi-cheemayile",
      "kalyaana-thaen-nila",
      "antha-vanatha",
      "malaiyoram-veesum-kaathu",
      "panivizhum-iravu",
      "ilaya-nila-pozhigirathe",
      "sundari",
      "valaiyosai",
      "nila-adhu-vanathumele"
    ]
  }
]

export function getTracksForPlaylist(playlistId: string): Track[] {
  const playlist = playlists.find(p => p.id === playlistId)
  if (!playlist) return []
  return playlist.trackIds
    .map(id => masterTracks.find(t => t.id === id))
    .filter((t): t is Track => !!t)
}
