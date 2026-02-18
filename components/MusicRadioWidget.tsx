'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Music, Play, Pause, ChevronDown, ChevronUp, Volume2, VolumeX, Loader2, Globe, MapPin, X, Search } from 'lucide-react'

/* ─────────────────────────────────────────────
   COMPREHENSIVE MUSIC RADIO CATALOG
   ───────────────────────────────────────────── */

interface RadioStation {
  name: string
  url: string
  country: string
  genre?: string
  language?: string
  region?: string
  state?: string
}

interface StationGroup {
  label: string
  stations: RadioStation[]
}

// India state-wise music stations
const INDIA_MUSIC_STATIONS: RadioStation[] = [
  // National
  { name: 'AIR FM Rainbow', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio010/playlist.m3u8', country: 'IN', genre: 'Bollywood/Pop', region: 'India', state: 'National' },
  { name: 'Radio Mirchi', url: 'https://stream.zeno.fm/m0y2kf8a1wzuv', country: 'IN', genre: 'Bollywood Hits', region: 'India', state: 'National' },
  { name: 'Vividh Bharati National', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio048/playlist.m3u8', country: 'IN', genre: 'Hindi Film Music', region: 'India', state: 'National' },
  { name: 'Bollywood Radio', url: 'https://stream.zeno.fm/f3wvbbqmdg8uv', country: 'IN', genre: 'Bollywood', region: 'India', state: 'National' },
  // Tamil Nadu
  { name: 'Radio Mirchi Tamil', url: 'https://stream.zeno.fm/0rd1n5yrp08uv', country: 'IN', genre: 'Tamil Hits', region: 'India', state: 'Tamil Nadu' },
  { name: 'Suryan FM Tamil', url: 'https://stream.zeno.fm/dnr5rypf8wzuv', country: 'IN', genre: 'Tamil Pop', region: 'India', state: 'Tamil Nadu' },
  { name: 'AIR Chennai FM', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio019/playlist.m3u8', country: 'IN', genre: 'Tamil Classical', region: 'India', state: 'Tamil Nadu' },
  { name: 'Hello FM Tamil', url: 'https://stream.zeno.fm/7pv1bynwsp8uv', country: 'IN', genre: 'Tamil', region: 'India', state: 'Tamil Nadu' },
  // Maharashtra
  { name: 'Radio City Mumbai', url: 'https://prclive1.listenon.in/Hindi', country: 'IN', genre: 'Bollywood', region: 'India', state: 'Maharashtra' },
  { name: 'AIR FM Mumbai', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio044/playlist.m3u8', country: 'IN', genre: 'Marathi/Hindi', region: 'India', state: 'Maharashtra' },
  { name: 'Radio One Mumbai', url: 'https://stream.zeno.fm/k2s5wh9w008uv', country: 'IN', genre: 'Bollywood Retro', region: 'India', state: 'Maharashtra' },
  // Delhi NCR
  { name: 'Radio City Delhi', url: 'https://prclive1.listenon.in/Delhi', country: 'IN', genre: 'Hindi Pop', region: 'India', state: 'Delhi' },
  { name: 'AIR FM Gold Delhi', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio011/playlist.m3u8', country: 'IN', genre: 'Hindi Retro', region: 'India', state: 'Delhi' },
  { name: 'Hit FM 95 Delhi', url: 'https://stream.zeno.fm/ztyp2g5w3p8uv', country: 'IN', genre: 'Top 40', region: 'India', state: 'Delhi' },
  // Karnataka
  { name: 'Radio City Bangalore', url: 'https://prclive1.listenon.in/Kannada', country: 'IN', genre: 'Kannada', region: 'India', state: 'Karnataka' },
  { name: 'AIR Bengaluru FM', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio082/playlist.m3u8', country: 'IN', genre: 'Kannada/English', region: 'India', state: 'Karnataka' },
  // Telangana
  { name: 'AIR Hyderabad FM', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio030/playlist.m3u8', country: 'IN', genre: 'Telugu', region: 'India', state: 'Telangana' },
  { name: 'Radio Mirchi Telugu', url: 'https://stream.zeno.fm/bh7b25nr8wzuv', country: 'IN', genre: 'Telugu Hits', region: 'India', state: 'Telangana' },
  // West Bengal
  { name: 'AIR Kolkata FM', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio036/playlist.m3u8', country: 'IN', genre: 'Bengali', region: 'India', state: 'West Bengal' },
  { name: 'Radio Mirchi Bangla', url: 'https://stream.zeno.fm/n6gfr15q008uv', country: 'IN', genre: 'Bengali Hits', region: 'India', state: 'West Bengal' },
  // Gujarat
  { name: 'AIR Ahmedabad FM', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio004/playlist.m3u8', country: 'IN', genre: 'Gujarati', region: 'India', state: 'Gujarat' },
  { name: 'Radio City Ahmedabad', url: 'https://stream.zeno.fm/3yr4kfdd8wzuv', country: 'IN', genre: 'Gujarati Hits', region: 'India', state: 'Gujarat' },
  // Rajasthan
  { name: 'AIR Jaipur FM', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio032/playlist.m3u8', country: 'IN', genre: 'Rajasthani/Hindi', region: 'India', state: 'Rajasthan' },
  // Kerala
  { name: 'AIR Trivandrum FM', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio076/playlist.m3u8', country: 'IN', genre: 'Malayalam', region: 'India', state: 'Kerala' },
  { name: 'Club FM Kerala', url: 'https://stream.zeno.fm/a54f1ps5dn8uv', country: 'IN', genre: 'Malayalam Hits', region: 'India', state: 'Kerala' },
  // Andhra Pradesh
  { name: 'AIR Vijayawada FM', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio083/playlist.m3u8', country: 'IN', genre: 'Telugu', region: 'India', state: 'Andhra Pradesh' },
  // Punjab
  { name: 'AIR Jalandhar FM', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio031/playlist.m3u8', country: 'IN', genre: 'Punjabi', region: 'India', state: 'Punjab' },
  { name: 'Radio Mirchi Punjabi', url: 'https://stream.zeno.fm/nsd4f8q1dn8uv', country: 'IN', genre: 'Punjabi Hits', region: 'India', state: 'Punjab' },
  // Madhya Pradesh
  { name: 'AIR Bhopal FM', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio012/playlist.m3u8', country: 'IN', genre: 'Hindi', region: 'India', state: 'Madhya Pradesh' },
  // Uttar Pradesh
  { name: 'AIR Lucknow FM', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio040/playlist.m3u8', country: 'IN', genre: 'Hindi', region: 'India', state: 'Uttar Pradesh' },
  // Bihar
  { name: 'AIR Patna FM', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio060/playlist.m3u8', country: 'IN', genre: 'Bhojpuri/Hindi', region: 'India', state: 'Bihar' },
  // Odisha
  { name: 'AIR Cuttack FM', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio022/playlist.m3u8', country: 'IN', genre: 'Odia', region: 'India', state: 'Odisha' },
  // Assam
  { name: 'AIR Guwahati FM', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio028/playlist.m3u8', country: 'IN', genre: 'Assamese', region: 'India', state: 'Assam' },
  // Jharkhand
  { name: 'AIR Ranchi FM', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio065/playlist.m3u8', country: 'IN', genre: 'Hindi/Tribal', region: 'India', state: 'Jharkhand' },
  // Goa
  { name: 'AIR Panaji FM', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio058/playlist.m3u8', country: 'IN', genre: 'Konkani/English', region: 'India', state: 'Goa' },
  // Uttarakhand
  { name: 'AIR Dehradun FM', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio023/playlist.m3u8', country: 'IN', genre: 'Hindi/Garhwali', region: 'India', state: 'Uttarakhand' },
  // Chhattisgarh
  { name: 'AIR Raipur FM', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio064/playlist.m3u8', country: 'IN', genre: 'Hindi/Chhattisgarhi', region: 'India', state: 'Chhattisgarh' },
  // Jammu & Kashmir
  { name: 'AIR Srinagar FM', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio072/playlist.m3u8', country: 'IN', genre: 'Kashmiri/Urdu', region: 'India', state: 'Jammu & Kashmir' },
  // Himachal Pradesh
  { name: 'AIR Shimla FM', url: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio070/playlist.m3u8', country: 'IN', genre: 'Hindi/Pahari', region: 'India', state: 'Himachal Pradesh' },
]

// Global music stations by genre/region
const GLOBAL_MUSIC_STATIONS: RadioStation[] = [
  // USA / International Pop & Rock
  { name: 'iHeart Top 40', url: 'https://stream.revma.ihrhls.com/zc4868/hls.m3u8', country: 'US', genre: 'Top 40/Pop', region: 'North America' },
  { name: 'Classic Rock Florida', url: 'https://stream.zeno.fm/mn9p17n4e08uv', country: 'US', genre: 'Classic Rock', region: 'North America' },
  { name: 'SomaFM Groove Salad', url: 'https://ice1.somafm.com/groovesalad-128-mp3', country: 'US', genre: 'Chill/Ambient', region: 'North America' },
  { name: 'KEXP Seattle', url: 'https://kexp-mp3-128.streamguys1.com/kexp128.mp3', country: 'US', genre: 'Indie/Alt Rock', region: 'North America' },
  { name: 'Jazz FM', url: 'https://stream.zeno.fm/ynm8q19fkzzuv', country: 'US', genre: 'Jazz', region: 'North America' },
  { name: 'Hot 108 JAMZ', url: 'https://stream.zeno.fm/0r0xa792kwzuv', country: 'US', genre: 'Hip Hop/R&B', region: 'North America' },
  { name: 'Country Road Radio', url: 'https://stream.zeno.fm/1r9r8wepdn8uv', country: 'US', genre: 'Country', region: 'North America' },
  { name: 'SomaFM DEF CON', url: 'https://ice1.somafm.com/defcon-128-mp3', country: 'US', genre: 'EDM/Electronic', region: 'North America' },
  { name: 'Classical WQXR', url: 'https://stream.wqxr.org/wqxr', country: 'US', genre: 'Classical', region: 'North America' },
  { name: 'SomaFM Lush', url: 'https://ice1.somafm.com/lush-128-mp3', country: 'US', genre: 'Smooth/Lounge', region: 'North America' },
  // UK
  { name: 'BBC Radio 1', url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_radio_one', country: 'GB', genre: 'Pop/Dance', region: 'Europe' },
  { name: 'BBC Radio 2', url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_radio_two', country: 'GB', genre: 'Adult Pop', region: 'Europe' },
  { name: 'BBC Radio 3', url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_radio_three', country: 'GB', genre: 'Classical/Jazz', region: 'Europe' },
  { name: 'BBC 6 Music', url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_6music', country: 'GB', genre: 'Alternative', region: 'Europe' },
  { name: 'Capital FM London', url: 'https://media-ssl.musicradio.com/CapitalMP3', country: 'GB', genre: 'Pop/Dance', region: 'Europe' },
  { name: 'Absolute Radio', url: 'https://stream.zeno.fm/bkrgz6d58wzuv', country: 'GB', genre: 'Rock', region: 'Europe' },
  // Canada
  { name: 'CBC Music', url: 'https://cbcliveradio-lh.akamaihd.net/i/CBCR2_TOR@383170/master.m3u8', country: 'CA', genre: 'Eclectic', region: 'North America' },
  // Germany
  { name: 'Klassik Radio', url: 'https://stream.klassikradio.de/live/mp3-192/stream.klassikradio.de/', country: 'DE', genre: 'Classical', region: 'Europe' },
  { name: 'Sunshine Live EDM', url: 'https://stream.sunshine-live.de/live/mp3-192/stream.sunshine-live.de/', country: 'DE', genre: 'EDM/Dance', region: 'Europe' },
  // France
  { name: 'FIP Radio', url: 'https://stream.radiofrance.fr/fip/fip_hifi.m3u8', country: 'FR', genre: 'World/Jazz/Rock', region: 'Europe' },
  { name: 'NRJ France', url: 'https://scdn.nrjaudio.fm/adwz1/fr/30001/mp3_128.mp3', country: 'FR', genre: 'Pop/Dance', region: 'Europe' },
  // Spain
  { name: 'Los 40 Spain', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/LOS40.mp3', country: 'ES', genre: 'Latin Pop', region: 'Europe' },
  { name: 'Cadena SER', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/CADENASER.mp3', country: 'ES', genre: 'Spanish Music', region: 'Europe' },
  // Italy
  { name: 'Radio Italia', url: 'https://radioitaliasmi.akamaized.net/hls/live/2093120/RILIVE/master.m3u8', country: 'IT', genre: 'Italian Pop', region: 'Europe' },
  // Netherlands
  { name: 'Radio 538', url: 'https://21253.live.streamtheworld.com/RADIO538.mp3', country: 'NL', genre: 'Pop/Dance', region: 'Europe' },
  // Sweden
  { name: 'P3 Star', url: 'https://sverigesradio.se/topsy/direkt/164-hi-mp3.m3u', country: 'SE', genre: 'Swedish Pop', region: 'Europe' },
  // Brazil
  { name: 'Bossa Nova Radio', url: 'https://stream.zeno.fm/nf5s7ca8b08uv', country: 'BR', genre: 'Bossa Nova', region: 'South America' },
  { name: 'Radio Globo FM', url: 'https://stream.sgr.globo.com/sgr/globofmrj/playlist.m3u8', country: 'BR', genre: 'MPB/Brazilian', region: 'South America' },
  // Argentina
  { name: 'La 100 FM', url: 'https://la100-edge.stream.teslatel.com/la100/live', country: 'AR', genre: 'Latin Pop', region: 'South America' },
  // Mexico
  { name: 'Stereo 100.3 Mexico', url: 'https://stream.zeno.fm/pqb3vbz7sp8uv', country: 'MX', genre: 'Regional Mexican', region: 'North America' },
  // Japan
  { name: 'J-Wave Tokyo', url: 'https://stream.zeno.fm/c8k5rfzqb08uv', country: 'JP', genre: 'J-Pop', region: 'Asia' },
  { name: 'Asia DREAM Radio', url: 'https://stream.zeno.fm/y9t2drhqb08uv', country: 'JP', genre: 'Asian Pop', region: 'Asia' },
  // South Korea
  { name: 'K-Pop Radio', url: 'https://stream.zeno.fm/4f5zh9rbk08uv', country: 'KR', genre: 'K-Pop', region: 'Asia' },
  // China
  { name: 'CRI Hit FM', url: 'https://sk.cri.cn/hj003.m3u8', country: 'CN', genre: 'Chinese Pop', region: 'Asia' },
  // Australia
  { name: 'Triple J', url: 'https://mediaserviceslive.akamaized.net/hls/live/2038308/triplejnsw/index.m3u8', country: 'AU', genre: 'Indie/Alt', region: 'Oceania' },
  { name: 'ABC Classic', url: 'https://mediaserviceslive.akamaized.net/hls/live/2038316/abcclassic/index.m3u8', country: 'AU', genre: 'Classical', region: 'Oceania' },
  // New Zealand
  { name: 'The Edge NZ', url: 'https://stream.zeno.fm/n31thz80d08uv', country: 'NZ', genre: 'Pop/Rock', region: 'Oceania' },
  // UAE / Middle East
  { name: 'Virgin Radio Dubai', url: 'https://stream.zeno.fm/4nbk8xh39wzuv', country: 'AE', genre: 'Pop/Dance', region: 'Middle East' },
  { name: 'Mazaj FM Jordan', url: 'https://stream.zeno.fm/9xsf25n5dn8uv', country: 'JO', genre: 'Arabic Pop', region: 'Middle East' },
  // Egypt
  { name: 'Nile FM Egypt', url: 'https://stream.zeno.fm/mn830hyb6hzuv', country: 'EG', genre: 'Arabic/Pop', region: 'Middle East' },
  // South Africa
  { name: 'Jacaranda FM', url: 'https://stream.zeno.fm/nhnsx54a1wzuv', country: 'ZA', genre: 'Afrikaans/Pop', region: 'Africa' },
  { name: '5FM South Africa', url: 'https://icecast.sabc.co.za/5fm', country: 'ZA', genre: 'Pop/Rock', region: 'Africa' },
  // Nigeria
  { name: 'Cool FM Lagos', url: 'https://stream.zeno.fm/f2zd31m4e08uv', country: 'NG', genre: 'Afrobeats', region: 'Africa' },
  // Kenya
  { name: 'Capital FM Kenya', url: 'https://stream.zeno.fm/ydcbz7eqb08uv', country: 'KE', genre: 'Afro/Pop', region: 'Africa' },
  // Pakistan
  { name: 'FM 91 Lahore', url: 'https://stream.zeno.fm/ds54kn0gdn8uv', country: 'PK', genre: 'Pakistani Pop', region: 'Asia' },
  // Bangladesh
  { name: 'Radio Foorti', url: 'https://stream.zeno.fm/g1k2d04sdn8uv', country: 'BD', genre: 'Bangla Pop', region: 'Asia' },
  // Sri Lanka
  { name: 'Yes FM Sri Lanka', url: 'https://stream.zeno.fm/dy00mqd5dn8uv', country: 'LK', genre: 'Sinhala Pop', region: 'Asia' },
  // Singapore
  { name: 'Power 98 FM', url: 'https://radio.toggle.sg/toggle/power98/playlist.m3u8', country: 'SG', genre: 'Pop/Dance', region: 'Asia' },
  // Malaysia
  { name: 'Hitz FM Malaysia', url: 'https://stream.zeno.fm/2sy7bz7w3p8uv', country: 'MY', genre: 'Pop/Dance', region: 'Asia' },
  // Philippines
  { name: 'Wish 107.5 FM', url: 'https://stream.zeno.fm/prqh7dn4e08uv', country: 'PH', genre: 'OPM/Pop', region: 'Asia' },
  // Thailand
  { name: 'EFM 94 Bangkok', url: 'https://stream.zeno.fm/zx6v3tp4e08uv', country: 'TH', genre: 'Thai Pop', region: 'Asia' },
  // Indonesia
  { name: 'Prambors FM', url: 'https://stream.zeno.fm/ks5b7n3vdn8uv', country: 'ID', genre: 'Indonesian Pop', region: 'Asia' },
  // Turkey
  { name: 'Power Turk FM', url: 'https://stream.zeno.fm/98r4fhyqb08uv', country: 'TR', genre: 'Turkish Pop', region: 'Europe' },
  // Russia
  { name: 'Europa Plus', url: 'https://ep128.hostingradio.ru:8030/ep128', country: 'RU', genre: 'Euro Pop', region: 'Europe' },
  // Poland
  { name: 'Radio ZET', url: 'https://stream.zeno.fm/ck2p7ynwsp8uv', country: 'PL', genre: 'Polish Pop', region: 'Europe' },
  // Israel
  { name: 'Galgalatz', url: 'https://glz.media.kan.org.il/hls/live/2019693/2019693/master.m3u8', country: 'IL', genre: 'Hebrew Pop', region: 'Middle East' },
  // Nepal
  { name: 'Kantipur FM', url: 'https://stream.zeno.fm/7rr3gv0gdn8uv', country: 'NP', genre: 'Nepali Pop', region: 'Asia' },
  // Vietnam
  { name: 'VOV3 Music', url: 'https://stream.zeno.fm/mr4gz6r5dn8uv', country: 'VN', genre: 'Vietnamese Pop', region: 'Asia' },
  // Genre-specific international
  { name: 'Ibiza Global Radio', url: 'https://stream.zeno.fm/4e0p66x9spzuv', country: 'ES', genre: 'Deep House/Chill', region: 'Genre Stations' },
  { name: 'Lofi Hip Hop Radio', url: 'https://stream.zeno.fm/f3wvbbqmdg8uv', country: 'US', genre: 'Lo-Fi/Chill', region: 'Genre Stations' },
  { name: 'Reggae Radio', url: 'https://stream.zeno.fm/8rd2gs9wkzzuv', country: 'JM', genre: 'Reggae', region: 'Genre Stations' },
  { name: 'Latin Beats Radio', url: 'https://stream.zeno.fm/05c5y4v1dn8uv', country: 'US', genre: 'Latin/Salsa', region: 'Genre Stations' },
  { name: 'Smooth Jazz Global', url: 'https://stream.zeno.fm/ynm8q19fkzzuv', country: 'US', genre: 'Smooth Jazz', region: 'Genre Stations' },
  { name: 'Metal Rock Radio', url: 'https://stream.zeno.fm/pw5z55nqe08uv', country: 'US', genre: 'Heavy Metal', region: 'Genre Stations' },
  { name: 'Trance Radio', url: 'https://stream.zeno.fm/6m7f1n4vdn8uv', country: 'NL', genre: 'Trance/Progressive', region: 'Genre Stations' },
  { name: 'Blues Radio', url: 'https://stream.zeno.fm/rk5b7n3vdn8uv', country: 'US', genre: 'Blues', region: 'Genre Stations' },
  { name: 'Sufi Music Radio', url: 'https://stream.zeno.fm/6rqb5yh39wzuv', country: 'PK', genre: 'Sufi/Qawwali', region: 'Genre Stations' },
  { name: 'Carnatic Classical', url: 'https://stream.zeno.fm/crvb5yh39wzuv', country: 'IN', genre: 'Carnatic', region: 'Genre Stations' },
  { name: 'Hindustani Classical', url: 'https://stream.zeno.fm/drvb5yh39wzuv', country: 'IN', genre: 'Hindustani', region: 'Genre Stations' },
  { name: 'African Beats', url: 'https://stream.zeno.fm/89f3ght9spzuv', country: 'NG', genre: 'Afrobeats/Afro Pop', region: 'Genre Stations' },
]

// Build grouped station catalog
function buildStationGroups(): StationGroup[] {
  const indiaStates = Array.from(new Set(INDIA_MUSIC_STATIONS.map(s => s.state!)))
  const indiaGroups: StationGroup[] = indiaStates.map(state => ({
    label: `India - ${state}`,
    stations: INDIA_MUSIC_STATIONS.filter(s => s.state === state),
  }))

  const regions = Array.from(new Set(GLOBAL_MUSIC_STATIONS.map(s => s.region!)))
  const globalGroups: StationGroup[] = regions.map(region => ({
    label: region,
    stations: GLOBAL_MUSIC_STATIONS.filter(s => s.region === region),
  }))

  return [...indiaGroups, ...globalGroups]
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
  const allStations = [...INDIA_MUSIC_STATIONS, ...GLOBAL_MUSIC_STATIONS]

  if (countryCode === 'IN' && regionName) {
    const key = regionName.toLowerCase()
    const stateName = INDIA_STATE_MAP[key]
    if (stateName) {
      const stateStation = INDIA_MUSIC_STATIONS.find(s => s.state === stateName)
      if (stateStation) return stateStation
    }
    return INDIA_MUSIC_STATIONS.find(s => s.state === 'National')!
  }

  if (countryCode === 'IN') {
    return INDIA_MUSIC_STATIONS.find(s => s.state === 'National')!
  }

  const countryMatch = allStations.find(s => s.country === countryCode)
  if (countryMatch) return countryMatch

  // Fallback to international pop
  return GLOBAL_MUSIC_STATIONS.find(s => s.name === 'iHeart Top 40')!
}

/* ─────────────────────────────────────────────
   COMPONENT
   ───────────────────────────────────────────── */

export default function MusicRadioWidget() {
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

        const savedStation = sessionStorage.getItem('ghl-music-radio-station')
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
        const fallback = INDIA_MUSIC_STATIONS.find(s => s.state === 'National')!
        setGeoStation(fallback)
        setCurrentStation(fallback)
        setGeoInfo({ country: 'IN', region: '' })
      }
    }
    detectGeo()
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
    sessionStorage.setItem('ghl-music-radio-station', JSON.stringify(station))
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
      (s.genre && s.genre.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.state && s.state.toLowerCase().includes(searchQuery.toLowerCase())) ||
      g.label.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(g => g.stations.length > 0)

  return (
    <>
      {/* Floating trigger button - right side */}
      <div className="fixed z-[9994] group" style={{ bottom: '272px', right: '24px' }}>
        {!isOpen && isPlaying && (
          <>
            <span className="absolute inset-0 rounded-full bg-violet-500/30 animate-ping opacity-20" />
            <span className="absolute inset-0 rounded-full bg-violet-500/20 animate-pulse-ring" />
          </>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110"
          style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 50%, #5B21B6 100%)' }}
          aria-label="Music Radio"
        >
          <Music className="w-5 h-5 text-white" />
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
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
            <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl">
              Music Radio
              <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900" />
            </div>
          </div>
        )}
      </div>

      {/* Radio Panel */}
      {isOpen && (
        <div
          className="fixed z-[9995] w-80 max-w-[calc(100vw-3rem)] rounded-2xl shadow-2xl overflow-hidden transition-all duration-500"
          style={{
            bottom: '332px',
            right: '24px',
            background: 'rgba(10, 10, 10, 0.96)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(124, 58, 237, 0.25)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)' }}>
                <Music className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-white text-xs font-bold">Music Radio</h3>
                {geoInfo && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-2.5 h-2.5 text-violet-400" />
                    <span className="text-violet-400/70 text-[9px]">
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
                <p className="text-[9px] uppercase tracking-wider text-violet-500/80 font-semibold mb-0.5">Now Playing</p>
                <p className="text-white text-sm font-medium truncate">
                  {currentStation?.name || 'Detecting location...'}
                </p>
                <div className="flex items-center space-x-2">
                  {currentStation && (
                    <p className="text-gray-500 text-[10px] truncate">
                      {currentStation.genre && <span className="text-violet-400/70">{currentStation.genre}</span>}
                      {currentStation.state ? ` \u00B7 ${currentStation.state}` : ` \u00B7 ${currentStation.country}`}
                      {manualOverride && <span className="text-violet-500/60 ml-1">(manual)</span>}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={toggleMute}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted
                    ? <VolumeX className="w-3.5 h-3.5 text-gray-400" />
                    : <Volume2 className="w-3.5 h-3.5 text-violet-400" />}
                </button>
                <button
                  onClick={hasError ? retryPlay : togglePlay}
                  disabled={isLoading && !hasError}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 disabled:opacity-50"
                  style={{ background: hasError ? 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)' : 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)' }}
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
                    className="flex-1 bg-violet-500/60 rounded-t-sm"
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
                placeholder="Search stations, genres, states..."
                className="w-full pl-7 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-[11px] placeholder-gray-500 focus:ring-1 focus:ring-violet-500 focus:border-transparent outline-none"
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
                      <MapPin className="w-3 h-3 text-violet-400" />
                    ) : group.label === 'Genre Stations' ? (
                      <Music className="w-3 h-3 text-pink-400" />
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
                            ? 'bg-violet-500/10 text-violet-400'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className="truncate">
                          <span className="text-[11px]">{station.name}</span>
                          {station.genre && (
                            <span className="text-[9px] text-gray-600 ml-1.5">{station.genre}</span>
                          )}
                        </div>
                        {currentStation?.name === station.name && currentStation?.url === station.url && isPlaying && (
                          <div className="flex items-center space-x-0.5 ml-2 shrink-0">
                            <span className="w-0.5 h-2 bg-violet-400 rounded-full animate-pulse" />
                            <span className="w-0.5 h-3 bg-violet-400 rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
                            <span className="w-0.5 h-1.5 bg-violet-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
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
              {INDIA_MUSIC_STATIONS.length + GLOBAL_MUSIC_STATIONS.length} stations worldwide
            </span>
            {manualOverride && geoStation && (
              <button
                onClick={() => {
                  sessionStorage.removeItem('ghl-music-radio-station')
                  setManualOverride(false)
                  setCurrentStation(geoStation)
                  playStation(geoStation)
                }}
                className="text-violet-500/70 text-[9px] hover:text-violet-400 transition-colors"
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
