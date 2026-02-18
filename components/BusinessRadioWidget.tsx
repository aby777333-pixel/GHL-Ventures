'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Radio, Play, Pause, ChevronDown, ChevronUp, Volume2, VolumeX, Loader2, Globe, MapPin, X, Search } from 'lucide-react'

/* ─────────────────────────────────────────────
   COMPREHENSIVE BUSINESS / NEWS RADIO CATALOG
   ───────────────────────────────────────────── */

interface RadioStation {
  name: string
  url: string
  country: string
  language?: string
  region?: string
  state?: string // For India state-wise
}

interface StationGroup {
  label: string
  stations: RadioStation[]
}

// India state-wise business/news stations
const INDIA_STATIONS: RadioStation[] = [
  // National
  { name: 'All India Radio News', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio001/playlist.m3u8', country: 'IN', language: 'hi', region: 'India', state: 'National' },
  { name: 'AIR Vividh Bharati', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio048/playlist.m3u8', country: 'IN', language: 'hi', region: 'India', state: 'National' },
  { name: 'DD News Audio', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio086/playlist.m3u8', country: 'IN', language: 'hi', region: 'India', state: 'National' },
  // Tamil Nadu
  { name: 'AIR Chennai', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio019/playlist.m3u8', country: 'IN', language: 'ta', region: 'India', state: 'Tamil Nadu' },
  { name: 'Suryan FM 93.5 Chennai', url: 'https://stream.zeno.fm/dnr5rypf8wzuv', country: 'IN', language: 'ta', region: 'India', state: 'Tamil Nadu' },
  // Maharashtra
  { name: 'AIR Mumbai', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio044/playlist.m3u8', country: 'IN', language: 'mr', region: 'India', state: 'Maharashtra' },
  { name: 'Radio City Mumbai', url: 'https://prclive1.listenon.in/Hindi', country: 'IN', language: 'hi', region: 'India', state: 'Maharashtra' },
  // Delhi / NCR
  { name: 'AIR FM Gold Delhi', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio011/playlist.m3u8', country: 'IN', language: 'hi', region: 'India', state: 'Delhi' },
  { name: 'AIR Rainbow Delhi', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio010/playlist.m3u8', country: 'IN', language: 'hi', region: 'India', state: 'Delhi' },
  // Karnataka
  { name: 'AIR Bengaluru', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio082/playlist.m3u8', country: 'IN', language: 'kn', region: 'India', state: 'Karnataka' },
  { name: 'Radio City Bangalore', url: 'https://prclive1.listenon.in/Kannada', country: 'IN', language: 'kn', region: 'India', state: 'Karnataka' },
  // Telangana
  { name: 'AIR Hyderabad', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio030/playlist.m3u8', country: 'IN', language: 'te', region: 'India', state: 'Telangana' },
  // West Bengal
  { name: 'AIR Kolkata', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio036/playlist.m3u8', country: 'IN', language: 'bn', region: 'India', state: 'West Bengal' },
  // Gujarat
  { name: 'AIR Ahmedabad', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio004/playlist.m3u8', country: 'IN', language: 'gu', region: 'India', state: 'Gujarat' },
  // Rajasthan
  { name: 'AIR Jaipur', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio032/playlist.m3u8', country: 'IN', language: 'hi', region: 'India', state: 'Rajasthan' },
  // Kerala
  { name: 'AIR Thiruvananthapuram', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio076/playlist.m3u8', country: 'IN', language: 'ml', region: 'India', state: 'Kerala' },
  // Andhra Pradesh
  { name: 'AIR Vijayawada', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio083/playlist.m3u8', country: 'IN', language: 'te', region: 'India', state: 'Andhra Pradesh' },
  // Punjab
  { name: 'AIR Jalandhar', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio031/playlist.m3u8', country: 'IN', language: 'pa', region: 'India', state: 'Punjab' },
  // Madhya Pradesh
  { name: 'AIR Bhopal', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio012/playlist.m3u8', country: 'IN', language: 'hi', region: 'India', state: 'Madhya Pradesh' },
  // Uttar Pradesh
  { name: 'AIR Lucknow', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio040/playlist.m3u8', country: 'IN', language: 'hi', region: 'India', state: 'Uttar Pradesh' },
  // Bihar
  { name: 'AIR Patna', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio060/playlist.m3u8', country: 'IN', language: 'hi', region: 'India', state: 'Bihar' },
  // Odisha
  { name: 'AIR Cuttack', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio022/playlist.m3u8', country: 'IN', language: 'or', region: 'India', state: 'Odisha' },
  // Assam
  { name: 'AIR Guwahati', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio028/playlist.m3u8', country: 'IN', language: 'as', region: 'India', state: 'Assam' },
  // Jharkhand
  { name: 'AIR Ranchi', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio065/playlist.m3u8', country: 'IN', language: 'hi', region: 'India', state: 'Jharkhand' },
  // Goa
  { name: 'AIR Panaji', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio058/playlist.m3u8', country: 'IN', language: 'kk', region: 'India', state: 'Goa' },
  // Uttarakhand
  { name: 'AIR Dehradun', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio023/playlist.m3u8', country: 'IN', language: 'hi', region: 'India', state: 'Uttarakhand' },
  // Chhattisgarh
  { name: 'AIR Raipur', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio064/playlist.m3u8', country: 'IN', language: 'hi', region: 'India', state: 'Chhattisgarh' },
  // Jammu & Kashmir
  { name: 'AIR Srinagar', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio072/playlist.m3u8', country: 'IN', language: 'ur', region: 'India', state: 'Jammu & Kashmir' },
  // Himachal Pradesh
  { name: 'AIR Shimla', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio070/playlist.m3u8', country: 'IN', language: 'hi', region: 'India', state: 'Himachal Pradesh' },
]

// Global business/news radio stations
const GLOBAL_STATIONS: RadioStation[] = [
  // USA
  { name: 'Bloomberg Radio', url: 'https://stream.revma.ihrhls.com/zc1465/hls.m3u8', country: 'US', language: 'en', region: 'North America' },
  { name: 'CNBC Business Radio', url: 'https://stream.revma.ihrhls.com/zc5765/hls.m3u8', country: 'US', language: 'en', region: 'North America' },
  { name: 'NPR News', url: 'https://npr-ice.streamguys1.com/live.mp3', country: 'US', language: 'en', region: 'North America' },
  { name: 'Fox Business', url: 'https://stream.revma.ihrhls.com/zc2765/hls.m3u8', country: 'US', language: 'en', region: 'North America' },
  { name: 'CBS News Radio', url: 'https://stream.revma.ihrhls.com/zc557/hls.m3u8', country: 'US', language: 'en', region: 'North America' },
  // UK
  { name: 'BBC World Service', url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_world_service', country: 'GB', language: 'en', region: 'Europe' },
  { name: 'BBC Radio 4', url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_radio_fourfm', country: 'GB', language: 'en', region: 'Europe' },
  { name: 'LBC News', url: 'https://media-ssl.musicradio.com/LBCNews', country: 'GB', language: 'en', region: 'Europe' },
  { name: 'Sky News Radio', url: 'https://skynewsradio.hls.adaptive.level3.net/sky/live/skynewsradio/skynewsradio.isml/skynewsradio-audio=128000.m3u8', country: 'GB', language: 'en', region: 'Europe' },
  // Canada
  { name: 'CBC Radio One', url: 'https://cbcliveradio-lh.akamaihd.net/i/CBCR1_TOR@374081/master.m3u8', country: 'CA', language: 'en', region: 'North America' },
  { name: 'BNN Bloomberg Canada', url: 'https://corus-bnn.media.bnnbloomberg.ca/live/BNN/playlist.m3u8', country: 'CA', language: 'en', region: 'North America' },
  // Australia
  { name: 'ABC News Radio', url: 'https://mediaserviceslive.akamaized.net/hls/live/2038311/newsradio/index.m3u8', country: 'AU', language: 'en', region: 'Oceania' },
  { name: 'Sky News Australia', url: 'https://stream.skynews.com.au/live/snr/playlist.m3u8', country: 'AU', language: 'en', region: 'Oceania' },
  // Singapore
  { name: 'CNA 938', url: 'https://radio.toggle.sg/toggle/938live/playlist.m3u8', country: 'SG', language: 'en', region: 'Asia' },
  { name: 'Money FM 89.3', url: 'https://radio.toggle.sg/toggle/moneyfm/playlist.m3u8', country: 'SG', language: 'en', region: 'Asia' },
  // Hong Kong
  { name: 'RTHK Radio 3', url: 'https://rthkaudio2-lh.akamaihd.net/i/radio3_1@355866/master.m3u8', country: 'HK', language: 'en', region: 'Asia' },
  // Japan
  { name: 'NHK World Radio', url: 'https://nhkworld.webcdn.stream.ne.jp/www11/nhkworld/def/live/radio/r1/nhkwlive_radio_en_r1.m3u8', country: 'JP', language: 'en', region: 'Asia' },
  // Germany
  { name: 'Deutsche Welle', url: 'https://dw-media.dwelle.de/live/dw/dw-liveradio-en.mp3', country: 'DE', language: 'en', region: 'Europe' },
  // France
  { name: 'France 24 English', url: 'https://stream.radiofrance.fr/finfo/finfo.m3u8', country: 'FR', language: 'en', region: 'Europe' },
  { name: 'BFM Business', url: 'https://audio.bfmtv.com/bfmbusiness_128.mp3', country: 'FR', language: 'fr', region: 'Europe' },
  // UAE / Middle East
  { name: 'Dubai Eye 103.8', url: 'https://stream.zeno.fm/32nz4f5a3p8uv', country: 'AE', language: 'en', region: 'Middle East' },
  { name: 'Al Jazeera English', url: 'https://live-hls-audio-web-aje.getaj.net/VOICE-AJE/01.m3u8', country: 'QA', language: 'en', region: 'Middle East' },
  // South Africa
  { name: 'SAFM Business', url: 'https://icecast.sabc.co.za/safm', country: 'ZA', language: 'en', region: 'Africa' },
  // Brazil
  { name: 'CBN Business Radio', url: 'https://stream.sgr.globo.com/sgr/cbn_sp/playlist.m3u8', country: 'BR', language: 'pt', region: 'South America' },
  // China
  { name: 'CRI English', url: 'https://sk.cri.cn/am846.m3u8', country: 'CN', language: 'en', region: 'Asia' },
  // South Korea
  { name: 'KBS World Radio', url: 'https://worldradio0-kbs.gscdn.com/world_e_iradio.m3u8', country: 'KR', language: 'en', region: 'Asia' },
  // Russia
  { name: 'Business FM Russia', url: 'https://bfm.hostingradio.ru/bfm96.aacp', country: 'RU', language: 'ru', region: 'Europe' },
  // Netherlands
  { name: 'BNR Nieuwsradio', url: 'https://stream.bnr.nl/bnr_mp3_128_20', country: 'NL', language: 'nl', region: 'Europe' },
  // Ireland
  { name: 'Newstalk 106-108', url: 'https://stream.newstalklive.ie/newstalk-live.mp3', country: 'IE', language: 'en', region: 'Europe' },
  // New Zealand
  { name: 'RNZ National', url: 'https://radionz.streamguys1.com/national', country: 'NZ', language: 'en', region: 'Oceania' },
  // Spain
  { name: 'Radio Nacional Espana', url: 'https://rtvelivestream.akamaized.net/rtvesec/rne/rne_r1_main.m3u8', country: 'ES', language: 'es', region: 'Europe' },
  // Italy
  { name: 'Radio 24 Business', url: 'https://shoutcast.unitedradio.it/Radio24', country: 'IT', language: 'it', region: 'Europe' },
  // Israel
  { name: 'Kan Reshet Bet', url: 'https://kan-b.media.kan.org.il/hls/live/2024514/2024514/master.m3u8', country: 'IL', language: 'he', region: 'Middle East' },
  // Malaysia
  { name: 'BFM 89.9 Business', url: 'https://stream.bfrn.com.my:8443/bfm', country: 'MY', language: 'en', region: 'Asia' },
  // Philippines
  { name: 'ABS-CBN News', url: 'https://stream.zeno.fm/rs6kyd9br08uv', country: 'PH', language: 'en', region: 'Asia' },
  // Indonesia
  { name: 'Elshinta News', url: 'https://stream.zeno.fm/67w12nh51g8uv', country: 'ID', language: 'id', region: 'Asia' },
  // Nigeria
  { name: 'Arise News Radio', url: 'https://stream.zeno.fm/mq5g7c2kfzzuv', country: 'NG', language: 'en', region: 'Africa' },
  // Kenya
  { name: 'KBC Radio English', url: 'https://stream.zeno.fm/p53xt74p6hzuv', country: 'KE', language: 'en', region: 'Africa' },
  // Pakistan
  { name: 'FM 101 Islamabad', url: 'https://stream.zeno.fm/bhrsy14spzzuv', country: 'PK', language: 'ur', region: 'Asia' },
  // Bangladesh
  { name: 'BBC Bangla', url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_bangla_radio', country: 'BD', language: 'bn', region: 'Asia' },
  // Sri Lanka
  { name: 'SLBC City FM', url: 'https://stream.zeno.fm/qb6aqsf5dn8uv', country: 'LK', language: 'en', region: 'Asia' },
  // Nepal
  { name: 'Image FM Kathmandu', url: 'https://stream.zeno.fm/kzy57b5f8wzuv', country: 'NP', language: 'ne', region: 'Asia' },
  // Thailand
  { name: 'FM 96.5 News Bangkok', url: 'https://stream.zeno.fm/yfsmhj6pbzzuv', country: 'TH', language: 'th', region: 'Asia' },
  // Vietnam
  { name: 'VOV1 News', url: 'https://stream.zeno.fm/xndy6bvb5zzuv', country: 'VN', language: 'vi', region: 'Asia' },
  // Turkey
  { name: 'Bloomberg HT Turkey', url: 'https://stream.zeno.fm/r2v3fh0fdn8uv', country: 'TR', language: 'tr', region: 'Europe' },
  // Egypt
  { name: 'Nile FM News', url: 'https://stream.zeno.fm/mn830hyb6hzuv', country: 'EG', language: 'en', region: 'Middle East' },
  // Mexico
  { name: 'Radio Formula Business', url: 'https://stream.zeno.fm/5t6g4by9spzuv', country: 'MX', language: 'es', region: 'North America' },
  // Argentina
  { name: 'Radio Continental', url: 'https://continentalstream.com.ar:8080/continental', country: 'AR', language: 'es', region: 'South America' },
  // Sweden
  { name: 'Sveriges Radio P1', url: 'https://sverigesradio.se/topsy/direkt/132-hi-mp3.m3u', country: 'SE', language: 'sv', region: 'Europe' },
  // Switzerland
  { name: 'SRF 4 News', url: 'https://stream.srg-ssr.ch/m/drs4news/mp3_128', country: 'CH', language: 'de', region: 'Europe' },
  // Poland
  { name: 'TOK FM Business', url: 'https://stream.zeno.fm/ps5dwfnqe08uv', country: 'PL', language: 'pl', region: 'Europe' },
]

// Build grouped station catalog
function buildStationGroups(): StationGroup[] {
  const indiaStates = Array.from(new Set(INDIA_STATIONS.map(s => s.state!)))
  const indiaGroups: StationGroup[] = indiaStates.map(state => ({
    label: `India - ${state}`,
    stations: INDIA_STATIONS.filter(s => s.state === state),
  }))

  const regions = Array.from(new Set(GLOBAL_STATIONS.map(s => s.region!)))
  const globalGroups: StationGroup[] = regions.map(region => ({
    label: region,
    stations: GLOBAL_STATIONS.filter(s => s.region === region),
  }))

  return [...indiaGroups, ...globalGroups]
}

// Country code to language mapping for geolocation fallback
const COUNTRY_LANG_MAP: Record<string, string> = {
  IN: 'hi', US: 'en', GB: 'en', CA: 'en', AU: 'en', NZ: 'en', IE: 'en',
  SG: 'en', HK: 'en', MY: 'en', PH: 'en', ZA: 'en', NG: 'en', KE: 'en',
  DE: 'de', AT: 'de', CH: 'de', FR: 'fr', ES: 'es', MX: 'es', AR: 'es',
  BR: 'pt', PT: 'pt', JP: 'ja', KR: 'ko', CN: 'zh', RU: 'ru', PK: 'ur',
  BD: 'bn', NP: 'ne', LK: 'si', TH: 'th', VN: 'vi', ID: 'id', TR: 'tr',
  IL: 'he', AE: 'ar', QA: 'ar', EG: 'ar', NL: 'nl', SE: 'sv', PL: 'pl',
  IT: 'it',
}

// India state mapping from region/city
const INDIA_STATE_MAP: Record<string, string> = {
  'tamil nadu': 'Tamil Nadu', 'chennai': 'Tamil Nadu', 'coimbatore': 'Tamil Nadu', 'madurai': 'Tamil Nadu',
  'maharashtra': 'Maharashtra', 'mumbai': 'Maharashtra', 'pune': 'Maharashtra', 'nagpur': 'Maharashtra',
  'delhi': 'Delhi', 'new delhi': 'Delhi', 'noida': 'Delhi', 'gurgaon': 'Delhi', 'gurugram': 'Delhi',
  'karnataka': 'Karnataka', 'bangalore': 'Karnataka', 'bengaluru': 'Karnataka', 'mysore': 'Karnataka',
  'telangana': 'Telangana', 'hyderabad': 'Telangana', 'secunderabad': 'Telangana',
  'west bengal': 'West Bengal', 'kolkata': 'West Bengal', 'calcutta': 'West Bengal',
  'gujarat': 'Gujarat', 'ahmedabad': 'Gujarat', 'surat': 'Gujarat', 'vadodara': 'Gujarat',
  'rajasthan': 'Rajasthan', 'jaipur': 'Rajasthan', 'jodhpur': 'Rajasthan', 'udaipur': 'Rajasthan',
  'kerala': 'Kerala', 'kochi': 'Kerala', 'thiruvananthapuram': 'Kerala', 'trivandrum': 'Kerala',
  'andhra pradesh': 'Andhra Pradesh', 'vijayawada': 'Andhra Pradesh', 'visakhapatnam': 'Andhra Pradesh',
  'punjab': 'Punjab', 'chandigarh': 'Punjab', 'ludhiana': 'Punjab', 'amritsar': 'Punjab', 'jalandhar': 'Punjab',
  'madhya pradesh': 'Madhya Pradesh', 'bhopal': 'Madhya Pradesh', 'indore': 'Madhya Pradesh',
  'uttar pradesh': 'Uttar Pradesh', 'lucknow': 'Uttar Pradesh', 'kanpur': 'Uttar Pradesh', 'agra': 'Uttar Pradesh',
  'bihar': 'Bihar', 'patna': 'Bihar',
  'odisha': 'Odisha', 'bhubaneswar': 'Odisha', 'cuttack': 'Odisha',
  'assam': 'Assam', 'guwahati': 'Assam',
  'jharkhand': 'Jharkhand', 'ranchi': 'Jharkhand',
  'goa': 'Goa', 'panaji': 'Goa',
  'uttarakhand': 'Uttarakhand', 'dehradun': 'Uttarakhand',
  'chhattisgarh': 'Chhattisgarh', 'raipur': 'Chhattisgarh',
  'jammu': 'Jammu & Kashmir', 'kashmir': 'Jammu & Kashmir', 'srinagar': 'Jammu & Kashmir',
  'himachal pradesh': 'Himachal Pradesh', 'shimla': 'Himachal Pradesh',
}

function findStationByGeo(countryCode: string, regionName?: string): RadioStation {
  const allStations = [...INDIA_STATIONS, ...GLOBAL_STATIONS]

  if (countryCode === 'IN' && regionName) {
    const key = regionName.toLowerCase()
    const stateName = INDIA_STATE_MAP[key]
    if (stateName) {
      const stateStation = INDIA_STATIONS.find(s => s.state === stateName)
      if (stateStation) return stateStation
    }
    // Fallback to national India
    return INDIA_STATIONS.find(s => s.state === 'National')!
  }

  if (countryCode === 'IN') {
    return INDIA_STATIONS.find(s => s.state === 'National')!
  }

  // Try matching country code
  const countryMatch = allStations.find(s => s.country === countryCode)
  if (countryMatch) return countryMatch

  // Fallback to BBC World Service (universal English business news)
  return GLOBAL_STATIONS.find(s => s.name === 'BBC World Service')!
}

/* ─────────────────────────────────────────────
   COMPONENT
   ───────────────────────────────────────────── */

export default function BusinessRadioWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null)
  const [geoStation, setGeoStation] = useState<RadioStation | null>(null)
  const [manualOverride, setManualOverride] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
  const [geoInfo, setGeoInfo] = useState<{ country: string; region: string } | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const stationGroups = buildStationGroups()

  // Geolocation detection on mount
  useEffect(() => {
    async function detectGeo() {
      try {
        const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) })
        if (!res.ok) throw new Error('Geo fetch failed')
        const data = await res.json()
        const countryCode = data.country_code || 'IN'
        const regionName = data.region || data.city || ''
        setGeoInfo({ country: countryCode, region: regionName })

        // Check session storage for manual override
        const savedStation = sessionStorage.getItem('ghl-business-radio-station')
        if (savedStation) {
          try {
            const parsed = JSON.parse(savedStation) as RadioStation
            setCurrentStation(parsed)
            setManualOverride(true)
            setGeoStation(findStationByGeo(countryCode, regionName))
            return
          } catch { /* ignore */ }
        }

        const station = findStationByGeo(countryCode, regionName)
        setGeoStation(station)
        setCurrentStation(station)
      } catch {
        // Fallback to India national
        const fallback = INDIA_STATIONS.find(s => s.state === 'National')!
        setGeoStation(fallback)
        setCurrentStation(fallback)
        setGeoInfo({ country: 'IN', region: '' })
      }
    }
    detectGeo()

    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
    }
  }, [])

  // Auto-play once station is set
  useEffect(() => {
    if (currentStation && !audioRef.current) {
      playStation(currentStation)
    }
  }, [currentStation])

  const playStation = useCallback((station: RadioStation) => {
    setHasError(false)
    setIsLoading(true)

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.removeAttribute('src')
      audioRef.current.load()
    }

    const audio = new Audio()
    audio.crossOrigin = 'anonymous'
    audio.preload = 'none'

    audio.addEventListener('canplay', () => {
      setIsLoading(false)
      setIsPlaying(true)
      audio.play().catch(() => {
        setIsPlaying(false)
        setIsLoading(false)
      })
    })

    audio.addEventListener('error', () => {
      setIsLoading(false)
      setHasError(true)
      setIsPlaying(false)
    })

    audio.addEventListener('waiting', () => setIsLoading(true))
    audio.addEventListener('playing', () => { setIsLoading(false); setIsPlaying(true) })
    audio.addEventListener('stalled', () => setIsLoading(true))

    audio.src = station.url
    audio.load()
    audioRef.current = audio
  }, [])

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentStation) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      setIsLoading(true)
      // Re-create audio on play to handle stale connections
      playStation(currentStation)
    }
  }, [isPlaying, currentStation, playStation])

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }, [isMuted])

  const selectStation = useCallback((station: RadioStation) => {
    setCurrentStation(station)
    setManualOverride(true)
    sessionStorage.setItem('ghl-business-radio-station', JSON.stringify(station))
    playStation(station)
  }, [playStation])

  const retryPlay = useCallback(() => {
    if (currentStation) {
      playStation(currentStation)
    }
  }, [currentStation, playStation])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // Filter stations based on search
  const filteredGroups = stationGroups.map(g => ({
    ...g,
    stations: g.stations.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.state && s.state.toLowerCase().includes(searchQuery.toLowerCase())) ||
      g.label.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(g => g.stations.length > 0)

  return (
    <>
      {/* Floating trigger button - left side */}
      <div className="fixed z-[9994] group" style={{ bottom: '100px', left: '24px' }}>
        {!isOpen && isPlaying && (
          <>
            <span className="absolute inset-0 rounded-full bg-amber-500/30 animate-ping opacity-20" />
            <span className="absolute inset-0 rounded-full bg-amber-500/20 animate-pulse-ring" />
          </>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110"
          style={{ background: 'linear-gradient(135deg, #D97706 0%, #B45309 50%, #92400E 100%)' }}
          aria-label="Business Radio"
        >
          <Radio className="w-5 h-5 text-white" />
          {isPlaying && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          )}
          {isLoading && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3">
              <Loader2 className="w-3 h-3 text-white animate-spin" />
            </span>
          )}
        </button>

        {/* Tooltip */}
        {!isOpen && (
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
            <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl">
              Business Radio
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
            </div>
          </div>
        )}
      </div>

      {/* Radio Panel */}
      {isOpen && (
        <div
          className="fixed z-[9995] w-80 max-w-[calc(100vw-3rem)] rounded-2xl shadow-2xl overflow-hidden transition-all duration-500"
          style={{
            bottom: '160px',
            left: '24px',
            background: 'rgba(10, 10, 10, 0.96)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(217, 119, 6, 0.25)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #D97706 0%, #92400E 100%)' }}>
                <Radio className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-white text-xs font-bold">Business Radio</h3>
                {geoInfo && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-2.5 h-2.5 text-amber-400" />
                    <span className="text-amber-400/70 text-[9px]">
                      {geoInfo.region ? `${geoInfo.region}, ${geoInfo.country}` : geoInfo.country}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-white transition-colors p-1"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Now Playing */}
          <div className="px-4 py-3 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-3">
                <p className="text-[9px] uppercase tracking-wider text-amber-500/80 font-semibold mb-0.5">Now Playing</p>
                <p className="text-white text-sm font-medium truncate">
                  {currentStation?.name || 'Detecting location...'}
                </p>
                {currentStation && (
                  <p className="text-gray-500 text-[10px] truncate">
                    {currentStation.state ? `${currentStation.state}, India` : currentStation.country}
                    {manualOverride && <span className="text-amber-500/60 ml-1">(manual)</span>}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={toggleMute}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted
                    ? <VolumeX className="w-3.5 h-3.5 text-gray-400" />
                    : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
                </button>
                <button
                  onClick={hasError ? retryPlay : togglePlay}
                  disabled={isLoading && !hasError}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 disabled:opacity-50"
                  style={{ background: hasError ? 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)' : 'linear-gradient(135deg, #D97706 0%, #92400E 100%)' }}
                  aria-label={hasError ? 'Retry' : isPlaying ? 'Pause' : 'Play'}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : hasError ? (
                    <span className="text-white text-[10px] font-bold">Retry</span>
                  ) : isPlaying ? (
                    <Pause className="w-4 h-4 text-white" />
                  ) : (
                    <Play className="w-4 h-4 text-white ml-0.5" />
                  )}
                </button>
              </div>
            </div>
            {/* Visualizer bar */}
            {isPlaying && !isLoading && (
              <div className="flex items-end space-x-0.5 mt-2 h-3">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-amber-500/60 rounded-t-sm"
                    style={{
                      animation: `radioBar ${0.4 + Math.random() * 0.6}s ease-in-out ${Math.random() * 0.5}s infinite alternate`,
                      height: `${20 + Math.random() * 80}%`,
                    }}
                  />
                ))}
              </div>
            )}
            {hasError && (
              <p className="text-red-400 text-[10px] mt-1.5">Stream unavailable. Try another channel or retry.</p>
            )}
          </div>

          {/* Search */}
          <div className="px-4 py-2 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stations, countries, states..."
                className="w-full pl-7 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-[11px] placeholder-gray-500 focus:ring-1 focus:ring-amber-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Station List */}
          <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {filteredGroups.map((group) => (
              <div key={group.label}>
                <button
                  onClick={() => setExpandedGroup(expandedGroup === group.label ? null : group.label)}
                  className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    {group.label.startsWith('India') ? (
                      <MapPin className="w-3 h-3 text-amber-400" />
                    ) : (
                      <Globe className="w-3 h-3 text-blue-400" />
                    )}
                    <span className="text-gray-300 text-[11px] font-medium">{group.label}</span>
                    <span className="text-gray-600 text-[9px]">({group.stations.length})</span>
                  </div>
                  {expandedGroup === group.label
                    ? <ChevronUp className="w-3 h-3 text-gray-500" />
                    : <ChevronDown className="w-3 h-3 text-gray-500" />}
                </button>
                {expandedGroup === group.label && (
                  <div className="pb-1">
                    {group.stations.map((station, idx) => (
                      <button
                        key={`${station.name}-${idx}`}
                        onClick={() => selectStation(station)}
                        className={`w-full flex items-center justify-between px-6 py-1.5 text-left transition-colors ${
                          currentStation?.name === station.name && currentStation?.url === station.url
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span className="text-[11px] truncate">{station.name}</span>
                        {currentStation?.name === station.name && currentStation?.url === station.url && isPlaying && (
                          <div className="flex items-center space-x-0.5 ml-2">
                            <span className="w-0.5 h-2 bg-amber-400 rounded-full animate-pulse" />
                            <span className="w-0.5 h-3 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
                            <span className="w-0.5 h-1.5 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between">
            <span className="text-gray-600 text-[9px]">
              {INDIA_STATIONS.length + GLOBAL_STATIONS.length} stations worldwide
            </span>
            {manualOverride && geoStation && (
              <button
                onClick={() => {
                  sessionStorage.removeItem('ghl-business-radio-station')
                  setManualOverride(false)
                  setCurrentStation(geoStation)
                  playStation(geoStation)
                }}
                className="text-amber-500/70 text-[9px] hover:text-amber-400 transition-colors"
              >
                Reset to auto
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
