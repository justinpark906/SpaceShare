"use client";

import { CityMap } from "@/components/map";
import { AdminPanel } from "@/components/AdminPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/Header";
import { useEffect, useRef, useState } from "react";
import { Search, ChevronDown, MapPin, Clock, Shield } from "lucide-react";

// City coordinates for search - Top 200+ US cities by population
const CITY_COORDINATES: Record<
  string,
  { lat: number; lng: number; zoom: number }
> = {
  // Top 50
  "new york": { lat: 40.7128, lng: -74.006, zoom: 12 },
  "new york city": { lat: 40.7128, lng: -74.006, zoom: 12 },
  nyc: { lat: 40.7128, lng: -74.006, zoom: 12 },
  "los angeles": { lat: 34.0522, lng: -118.2437, zoom: 11 },
  la: { lat: 34.0522, lng: -118.2437, zoom: 11 },
  chicago: { lat: 41.8781, lng: -87.6298, zoom: 12 },
  houston: { lat: 29.7604, lng: -95.3698, zoom: 11 },
  phoenix: { lat: 33.4484, lng: -112.074, zoom: 11 },
  philadelphia: { lat: 39.9526, lng: -75.1652, zoom: 12 },
  philly: { lat: 39.9526, lng: -75.1652, zoom: 12 },
  "san antonio": { lat: 29.4241, lng: -98.4936, zoom: 11 },
  "san diego": { lat: 32.7157, lng: -117.1611, zoom: 11 },
  dallas: { lat: 32.7767, lng: -96.797, zoom: 11 },
  "san jose": { lat: 37.3382, lng: -121.8863, zoom: 12 },
  austin: { lat: 30.2672, lng: -97.7431, zoom: 12 },
  jacksonville: { lat: 30.3322, lng: -81.6557, zoom: 11 },
  "fort worth": { lat: 32.7555, lng: -97.3308, zoom: 12 },
  columbus: { lat: 39.9612, lng: -82.9988, zoom: 12 },
  charlotte: { lat: 35.2271, lng: -80.8431, zoom: 12 },
  "san francisco": { lat: 37.7749, lng: -122.4194, zoom: 13 },
  sf: { lat: 37.7749, lng: -122.4194, zoom: 13 },
  indianapolis: { lat: 39.7684, lng: -86.1581, zoom: 12 },
  indy: { lat: 39.7684, lng: -86.1581, zoom: 12 },
  seattle: { lat: 47.6062, lng: -122.3321, zoom: 12 },
  denver: { lat: 39.7392, lng: -104.9903, zoom: 12 },
  washington: { lat: 38.9072, lng: -77.0369, zoom: 12 },
  "washington dc": { lat: 38.9072, lng: -77.0369, zoom: 12 },
  dc: { lat: 38.9072, lng: -77.0369, zoom: 12 },
  boston: { lat: 42.3601, lng: -71.0589, zoom: 13 },
  "el paso": { lat: 31.7619, lng: -106.485, zoom: 12 },
  nashville: { lat: 36.1627, lng: -86.7816, zoom: 12 },
  detroit: { lat: 42.3314, lng: -83.0458, zoom: 12 },
  "oklahoma city": { lat: 35.4676, lng: -97.5164, zoom: 11 },
  okc: { lat: 35.4676, lng: -97.5164, zoom: 11 },
  portland: { lat: 45.5152, lng: -122.6784, zoom: 12 },
  "las vegas": { lat: 36.1699, lng: -115.1398, zoom: 11 },
  vegas: { lat: 36.1699, lng: -115.1398, zoom: 11 },
  memphis: { lat: 35.1495, lng: -90.049, zoom: 12 },
  louisville: { lat: 38.2527, lng: -85.7585, zoom: 12 },
  baltimore: { lat: 39.2904, lng: -76.6122, zoom: 12 },
  milwaukee: { lat: 43.0389, lng: -87.9065, zoom: 12 },
  albuquerque: { lat: 35.0844, lng: -106.6504, zoom: 12 },
  tucson: { lat: 32.2226, lng: -110.9747, zoom: 12 },
  fresno: { lat: 36.7378, lng: -119.7871, zoom: 12 },
  mesa: { lat: 33.4152, lng: -111.8315, zoom: 12 },
  sacramento: { lat: 38.5816, lng: -121.4944, zoom: 12 },
  atlanta: { lat: 33.749, lng: -84.388, zoom: 12 },
  atl: { lat: 33.749, lng: -84.388, zoom: 12 },
  "kansas city": { lat: 39.0997, lng: -94.5786, zoom: 12 },
  kc: { lat: 39.0997, lng: -94.5786, zoom: 12 },
  "colorado springs": { lat: 38.8339, lng: -104.8214, zoom: 12 },
  miami: { lat: 25.7617, lng: -80.1918, zoom: 12 },
  raleigh: { lat: 35.7796, lng: -78.6382, zoom: 12 },
  omaha: { lat: 41.2565, lng: -95.9345, zoom: 12 },
  "long beach": { lat: 33.767, lng: -118.1892, zoom: 12 },
  "virginia beach": { lat: 36.8529, lng: -75.978, zoom: 12 },
  oakland: { lat: 37.8044, lng: -122.2712, zoom: 13 },
  minneapolis: { lat: 44.9778, lng: -93.265, zoom: 12 },
  tulsa: { lat: 36.154, lng: -95.9928, zoom: 12 },
  tampa: { lat: 27.9506, lng: -82.4572, zoom: 12 },
  arlington: { lat: 32.7357, lng: -97.1081, zoom: 12 },
  "new orleans": { lat: 29.9511, lng: -90.0715, zoom: 12 },
  nola: { lat: 29.9511, lng: -90.0715, zoom: 12 },
  // 51-100
  wichita: { lat: 37.6872, lng: -97.3301, zoom: 12 },
  cleveland: { lat: 41.4993, lng: -81.6944, zoom: 12 },
  bakersfield: { lat: 35.3733, lng: -119.0187, zoom: 12 },
  aurora: { lat: 39.7294, lng: -104.8319, zoom: 12 },
  anaheim: { lat: 33.8366, lng: -117.9143, zoom: 13 },
  honolulu: { lat: 21.3069, lng: -157.8583, zoom: 12 },
  "santa ana": { lat: 33.7455, lng: -117.8677, zoom: 13 },
  riverside: { lat: 33.9806, lng: -117.3755, zoom: 12 },
  "corpus christi": { lat: 27.8006, lng: -97.3964, zoom: 12 },
  lexington: { lat: 38.0406, lng: -84.5037, zoom: 12 },
  stockton: { lat: 37.9577, lng: -121.2908, zoom: 12 },
  henderson: { lat: 36.0395, lng: -114.9817, zoom: 12 },
  "saint paul": { lat: 44.9537, lng: -93.09, zoom: 12 },
  "st paul": { lat: 44.9537, lng: -93.09, zoom: 12 },
  "st. paul": { lat: 44.9537, lng: -93.09, zoom: 12 },
  cincinnati: { lat: 39.1031, lng: -84.512, zoom: 12 },
  pittsburgh: { lat: 40.4406, lng: -79.9959, zoom: 12 },
  greensboro: { lat: 36.0726, lng: -79.792, zoom: 12 },
  anchorage: { lat: 61.2181, lng: -149.9003, zoom: 11 },
  plano: { lat: 33.0198, lng: -96.6989, zoom: 12 },
  lincoln: { lat: 40.8258, lng: -96.6852, zoom: 12 },
  orlando: { lat: 28.5383, lng: -81.3792, zoom: 12 },
  irvine: { lat: 33.6846, lng: -117.8265, zoom: 13 },
  newark: { lat: 40.7357, lng: -74.1724, zoom: 13 },
  toledo: { lat: 41.6528, lng: -83.5379, zoom: 12 },
  durham: { lat: 35.994, lng: -78.8986, zoom: 12 },
  "chula vista": { lat: 32.6401, lng: -117.0842, zoom: 12 },
  "fort wayne": { lat: 41.0793, lng: -85.1394, zoom: 12 },
  "jersey city": { lat: 40.7178, lng: -74.0431, zoom: 13 },
  "st. petersburg": { lat: 27.7676, lng: -82.6403, zoom: 12 },
  "st petersburg": { lat: 27.7676, lng: -82.6403, zoom: 12 },
  laredo: { lat: 27.5306, lng: -99.4803, zoom: 12 },
  madison: { lat: 43.0731, lng: -89.4012, zoom: 12 },
  chandler: { lat: 33.3062, lng: -111.8413, zoom: 12 },
  buffalo: { lat: 42.8864, lng: -78.8784, zoom: 12 },
  lubbock: { lat: 33.5779, lng: -101.8552, zoom: 12 },
  scottsdale: { lat: 33.4942, lng: -111.9261, zoom: 12 },
  reno: { lat: 39.5296, lng: -119.8138, zoom: 12 },
  glendale: { lat: 33.5387, lng: -112.1859, zoom: 12 },
  gilbert: { lat: 33.3528, lng: -111.789, zoom: 12 },
  "winston-salem": { lat: 36.0999, lng: -80.2442, zoom: 12 },
  "winston salem": { lat: 36.0999, lng: -80.2442, zoom: 12 },
  "north las vegas": { lat: 36.1989, lng: -115.1175, zoom: 12 },
  norfolk: { lat: 36.8508, lng: -76.2859, zoom: 12 },
  chesapeake: { lat: 36.7682, lng: -76.2875, zoom: 11 },
  garland: { lat: 32.9126, lng: -96.6389, zoom: 12 },
  irving: { lat: 32.814, lng: -96.9489, zoom: 12 },
  hialeah: { lat: 25.8576, lng: -80.2781, zoom: 12 },
  fremont: { lat: 37.5485, lng: -121.9886, zoom: 12 },
  boise: { lat: 43.615, lng: -116.2023, zoom: 12 },
  richmond: { lat: 37.5407, lng: -77.436, zoom: 12 },
  "baton rouge": { lat: 30.4515, lng: -91.1871, zoom: 12 },
  // 101-150
  spokane: { lat: 47.6588, lng: -117.426, zoom: 12 },
  "des moines": { lat: 41.5868, lng: -93.625, zoom: 12 },
  tacoma: { lat: 47.2529, lng: -122.4443, zoom: 12 },
  "san bernardino": { lat: 34.1083, lng: -117.2898, zoom: 12 },
  modesto: { lat: 37.6391, lng: -120.9969, zoom: 12 },
  fontana: { lat: 34.0922, lng: -117.435, zoom: 12 },
  "santa clarita": { lat: 34.3917, lng: -118.5426, zoom: 12 },
  birmingham: { lat: 33.5207, lng: -86.8025, zoom: 12 },
  oxnard: { lat: 34.1975, lng: -119.1771, zoom: 12 },
  fayetteville: { lat: 36.0626, lng: -94.1574, zoom: 12 },
  "moreno valley": { lat: 33.9425, lng: -117.2297, zoom: 12 },
  rochester: { lat: 43.1566, lng: -77.6088, zoom: 12 },
  "huntington beach": { lat: 33.6595, lng: -117.9988, zoom: 12 },
  "salt lake city": { lat: 40.7608, lng: -111.891, zoom: 12 },
  slc: { lat: 40.7608, lng: -111.891, zoom: 12 },
  "grand rapids": { lat: 42.9634, lng: -85.6681, zoom: 12 },
  amarillo: { lat: 35.222, lng: -101.8313, zoom: 12 },
  yonkers: { lat: 40.9312, lng: -73.8987, zoom: 13 },
  montgomery: { lat: 32.3668, lng: -86.3, zoom: 12 },
  akron: { lat: 41.0814, lng: -81.519, zoom: 12 },
  "little rock": { lat: 34.7465, lng: -92.2896, zoom: 12 },
  huntsville: { lat: 34.7304, lng: -86.5861, zoom: 12 },
  augusta: { lat: 33.4735, lng: -82.0105, zoom: 12 },
  "port st. lucie": { lat: 27.2939, lng: -80.3503, zoom: 12 },
  "port st lucie": { lat: 27.2939, lng: -80.3503, zoom: 12 },
  "grand prairie": { lat: 32.746, lng: -96.9978, zoom: 12 },
  tallahassee: { lat: 30.4383, lng: -84.2807, zoom: 12 },
  "overland park": { lat: 38.9822, lng: -94.6708, zoom: 12 },
  tempe: { lat: 33.4255, lng: -111.94, zoom: 13 },
  mckinney: { lat: 33.1972, lng: -96.6397, zoom: 12 },
  mobile: { lat: 30.6954, lng: -88.0399, zoom: 12 },
  "cape coral": { lat: 26.5629, lng: -81.9495, zoom: 12 },
  shreveport: { lat: 32.5252, lng: -93.7502, zoom: 12 },
  frisco: { lat: 33.1507, lng: -96.8236, zoom: 12 },
  knoxville: { lat: 35.9606, lng: -83.9207, zoom: 12 },
  worcester: { lat: 42.2626, lng: -71.8023, zoom: 12 },
  brownsville: { lat: 25.9017, lng: -97.4975, zoom: 12 },
  vancouver: { lat: 45.6387, lng: -122.6615, zoom: 12 },
  "fort lauderdale": { lat: 26.1224, lng: -80.1373, zoom: 12 },
  "sioux falls": { lat: 43.5446, lng: -96.7311, zoom: 12 },
  ontario: { lat: 34.0633, lng: -117.6509, zoom: 12 },
  chattanooga: { lat: 35.0456, lng: -85.3097, zoom: 12 },
  providence: { lat: 41.824, lng: -71.4128, zoom: 13 },
  "newport beach": { lat: 33.6189, lng: -117.9289, zoom: 13 },
  "rancho cucamonga": { lat: 34.1064, lng: -117.5931, zoom: 12 },
  "santa rosa": { lat: 38.4404, lng: -122.7141, zoom: 12 },
  peoria: { lat: 33.5806, lng: -112.2374, zoom: 12 },
  oceanside: { lat: 33.1959, lng: -117.3795, zoom: 12 },
  // 151-200+
  "elk grove": { lat: 38.4088, lng: -121.3716, zoom: 12 },
  salem: { lat: 44.9429, lng: -123.0351, zoom: 12 },
  "pembroke pines": { lat: 26.0128, lng: -80.3241, zoom: 12 },
  eugene: { lat: 44.0521, lng: -123.0868, zoom: 12 },
  "garden grove": { lat: 33.7743, lng: -117.9379, zoom: 13 },
  cary: { lat: 35.7915, lng: -78.7811, zoom: 12 },
  "fort collins": { lat: 40.5853, lng: -105.0844, zoom: 12 },
  corona: { lat: 33.8753, lng: -117.5664, zoom: 12 },
  springfield: { lat: 37.2153, lng: -93.2982, zoom: 12 },
  jackson: { lat: 32.2988, lng: -90.1848, zoom: 12 },
  alexandria: { lat: 38.8048, lng: -77.0469, zoom: 13 },
  hayward: { lat: 37.6688, lng: -122.0808, zoom: 12 },
  clarksville: { lat: 36.5298, lng: -87.3595, zoom: 12 },
  lakewood: { lat: 39.7047, lng: -105.0814, zoom: 12 },
  lancaster: { lat: 34.6868, lng: -118.1542, zoom: 12 },
  salinas: { lat: 36.6777, lng: -121.6555, zoom: 12 },
  palmdale: { lat: 34.5794, lng: -118.1165, zoom: 12 },
  hollywood: { lat: 26.0112, lng: -80.1495, zoom: 13 },
  macon: { lat: 32.8407, lng: -83.6324, zoom: 12 },
  sunnyvale: { lat: 37.3688, lng: -122.0363, zoom: 13 },
  pomona: { lat: 34.0551, lng: -117.7523, zoom: 12 },
  killeen: { lat: 31.1171, lng: -97.7278, zoom: 12 },
  escondido: { lat: 33.1192, lng: -117.0864, zoom: 12 },
  pasadena: { lat: 34.1478, lng: -118.1445, zoom: 13 },
  naperville: { lat: 41.7508, lng: -88.1535, zoom: 12 },
  bellevue: { lat: 47.6101, lng: -122.2015, zoom: 12 },
  joliet: { lat: 41.525, lng: -88.0817, zoom: 12 },
  murfreesboro: { lat: 35.8456, lng: -86.3903, zoom: 12 },
  midland: { lat: 31.9973, lng: -102.0779, zoom: 12 },
  rockford: { lat: 42.2711, lng: -89.094, zoom: 12 },
  paterson: { lat: 40.9168, lng: -74.1718, zoom: 13 },
  savannah: { lat: 32.0809, lng: -81.0912, zoom: 12 },
  bridgeport: { lat: 41.1865, lng: -73.1952, zoom: 13 },
  torrance: { lat: 33.8358, lng: -118.3406, zoom: 12 },
  mcallen: { lat: 26.2034, lng: -98.2301, zoom: 12 },
  syracuse: { lat: 43.0481, lng: -76.1474, zoom: 12 },
  surprise: { lat: 33.6292, lng: -112.3679, zoom: 12 },
  denton: { lat: 33.2148, lng: -97.1331, zoom: 12 },
  roseville: { lat: 38.7521, lng: -121.288, zoom: 12 },
  thornton: { lat: 39.868, lng: -104.9719, zoom: 12 },
  miramar: { lat: 25.9873, lng: -80.3223, zoom: 12 },
  mesquite: { lat: 32.7668, lng: -96.5992, zoom: 12 },
  olathe: { lat: 38.8814, lng: -94.8191, zoom: 12 },
  dayton: { lat: 39.7589, lng: -84.1916, zoom: 12 },
  carrollton: { lat: 32.9537, lng: -96.8903, zoom: 12 },
  waco: { lat: 31.5493, lng: -97.1467, zoom: 12 },
  orange: { lat: 33.7879, lng: -117.8531, zoom: 13 },
  fullerton: { lat: 33.8703, lng: -117.9253, zoom: 13 },
  charleston: { lat: 32.7765, lng: -79.9311, zoom: 12 },
  "west valley city": { lat: 40.6916, lng: -112.0011, zoom: 12 },
  visalia: { lat: 36.3302, lng: -119.2921, zoom: 12 },
  gainesville: { lat: 29.6516, lng: -82.3248, zoom: 12 },
  "coral springs": { lat: 26.2712, lng: -80.2706, zoom: 12 },
  "cedar rapids": { lat: 41.9779, lng: -91.6656, zoom: 12 },
  "new haven": { lat: 41.3082, lng: -72.9251, zoom: 13 },
  stamford: { lat: 41.0534, lng: -73.5387, zoom: 13 },
  elizabeth: { lat: 40.6639, lng: -74.2107, zoom: 13 },
  concord: { lat: 37.9779, lng: -122.0311, zoom: 12 },
  "thousand oaks": { lat: 34.1706, lng: -118.8376, zoom: 12 },
  kent: { lat: 47.3809, lng: -122.2348, zoom: 12 },
  topeka: { lat: 39.0489, lng: -95.678, zoom: 12 },
  "simi valley": { lat: 34.2694, lng: -118.7815, zoom: 12 },
  hartford: { lat: 41.7658, lng: -72.6734, zoom: 13 },
  fargo: { lat: 46.8772, lng: -96.7898, zoom: 12 },
  murrieta: { lat: 33.5539, lng: -117.2139, zoom: 12 },
  "ann arbor": { lat: 42.2808, lng: -83.743, zoom: 13 },
  abilene: { lat: 32.4487, lng: -99.7331, zoom: 12 },
  vallejo: { lat: 38.1041, lng: -122.2566, zoom: 12 },
  berkeley: { lat: 37.8716, lng: -122.2727, zoom: 13 },
  provo: { lat: 40.2338, lng: -111.6585, zoom: 12 },
  "round rock": { lat: 30.5083, lng: -97.6789, zoom: 12 },
  columbia: { lat: 34.0007, lng: -81.0348, zoom: 12 },
  allentown: { lat: 40.6084, lng: -75.4902, zoom: 12 },
  pearland: { lat: 29.5636, lng: -95.286, zoom: 12 },
  richardson: { lat: 32.9483, lng: -96.7299, zoom: 12 },
  "league city": { lat: 29.5075, lng: -95.0949, zoom: 12 },
  arvada: { lat: 39.8028, lng: -105.0875, zoom: 12 },
  "college station": { lat: 30.6014, lng: -96.3144, zoom: 12 },
  "santa clara": { lat: 37.3541, lng: -121.9552, zoom: 13 },
  clovis: { lat: 36.8252, lng: -119.7029, zoom: 12 },
  "new bedford": { lat: 41.6362, lng: -70.9342, zoom: 13 },
  fairfield: { lat: 38.2494, lng: -122.04, zoom: 12 },
  "west jordan": { lat: 40.6097, lng: -111.9391, zoom: 12 },
  cambridge: { lat: 42.3736, lng: -71.1097, zoom: 14 },
  clearwater: { lat: 27.9659, lng: -82.8001, zoom: 12 },
  billings: { lat: 45.7833, lng: -108.5007, zoom: 12 },
  "west palm beach": { lat: 26.7153, lng: -80.0534, zoom: 12 },
  evansville: { lat: 37.9748, lng: -87.5558, zoom: 12 },
  norwalk: { lat: 33.9025, lng: -118.0817, zoom: 13 },
  inglewood: { lat: 33.9617, lng: -118.3531, zoom: 13 },
  "high point": { lat: 35.9557, lng: -80.0053, zoom: 12 },
  "green bay": { lat: 44.5192, lng: -88.0198, zoom: 12 },
  everett: { lat: 47.9789, lng: -122.2021, zoom: 12 },
  lowell: { lat: 42.6334, lng: -71.3162, zoom: 13 },
  waterbury: { lat: 41.5582, lng: -73.0515, zoom: 13 },
  pueblo: { lat: 38.2544, lng: -104.6091, zoom: 12 },
  "el cajon": { lat: 32.7948, lng: -116.9625, zoom: 12 },
  lakeland: { lat: 28.0395, lng: -81.9498, zoom: 12 },
  burbank: { lat: 34.1808, lng: -118.3089, zoom: 13 },
  boulder: { lat: 40.015, lng: -105.2705, zoom: 13 },
  centennial: { lat: 39.5807, lng: -104.8772, zoom: 12 },
  downey: { lat: 33.94, lng: -118.1326, zoom: 13 },
  "costa mesa": { lat: 33.6411, lng: -117.9187, zoom: 13 },
  ventura: { lat: 34.2746, lng: -119.229, zoom: 12 },
  sparks: { lat: 39.5349, lng: -119.7527, zoom: 12 },
  antioch: { lat: 38.0049, lng: -121.8058, zoom: 12 },
  "san mateo": { lat: 37.563, lng: -122.3255, zoom: 13 },
  manchester: { lat: 42.9956, lng: -71.4548, zoom: 13 },
  temecula: { lat: 33.4936, lng: -117.1484, zoom: 12 },
  "santa maria": { lat: 34.953, lng: -120.4357, zoom: 12 },
  victorville: { lat: 34.5362, lng: -117.2928, zoom: 12 },
  "el monte": { lat: 34.0686, lng: -118.0276, zoom: 13 },
  "west covina": { lat: 34.0686, lng: -117.9394, zoom: 13 },
  "sandy springs": { lat: 33.9304, lng: -84.3733, zoom: 12 },
  gresham: { lat: 45.4982, lng: -122.431, zoom: 12 },
  lewisville: { lat: 33.0462, lng: -96.9942, zoom: 12 },
  tyler: { lat: 32.3513, lng: -95.3011, zoom: 12 },
  davie: { lat: 26.0765, lng: -80.2521, zoom: 12 },
  "lakewood ca": { lat: 33.8536, lng: -118.134, zoom: 13 },
  "miami gardens": { lat: 25.942, lng: -80.2456, zoom: 12 },
  "south bend": { lat: 41.6764, lng: -86.252, zoom: 12 },
  allen: { lat: 33.1032, lng: -96.6706, zoom: 12 },
  "las cruces": { lat: 32.3199, lng: -106.7637, zoom: 12 },
  "rio rancho": { lat: 35.2328, lng: -106.663, zoom: 12 },
  portsmouth: { lat: 43.0718, lng: -70.7626, zoom: 13 },
  warwick: { lat: 41.7001, lng: -71.4162, zoom: 12 },
  cranston: { lat: 41.7798, lng: -71.4373, zoom: 12 },
  pawtucket: { lat: 41.8787, lng: -71.3826, zoom: 13 },
  newport: { lat: 41.4901, lng: -71.3128, zoom: 13 },
};

export default function Home() {
  const mapSectionRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMapView, setIsMapView] = useState(false);
  const [mapCenter, setMapCenter] = useState<{
    lat: number;
    lng: number;
    zoom: number;
  } | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const mapTop = mapSectionRef.current?.offsetTop ?? 0;
      setIsMapView(window.scrollY >= mapTop - 8);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const scrollToMap = () => {
    mapSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.toLowerCase().trim();
    const cityData = CITY_COORDINATES[query];

    if (cityData) {
      setMapCenter(cityData);
    }
    // Always scroll to map on search
    scrollToMap();
  };

  return (
    <div className="scroll-smooth">
      <div
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isMapView
            ? "bg-black/60 backdrop-blur border-b border-white/5"
            : "bg-transparent"
        }`}
      >
        <Header variant="hero" />
      </div>

      <div className="bg-gradient-to-br from-black via-gray-900 to-green-950">
        {/* Hero Section - Full Viewport */}
        <section className="min-h-screen flex flex-col">
          {/* Hero Content */}
          <div className="relative z-0 flex-1 flex flex-col items-center justify-center px-6 -mt-16">
            <div className="max-w-4xl text-center space-y-8">
              {/* Main Headline */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
                Making the city's hidden corners{" "}
                <span className="text-green-500">work for everyone.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
                Discover and rent unused spaces in your neighborhood - parking
                spots, storage areas, gardens, and more.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="max-w-xl mx-auto w-full">
                <div className="relative flex items-center">
                  <Search className="absolute left-4 h-5 w-5 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Search a city"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-32 py-6 text-lg rounded-full border-2 border-gray-700 bg-gray-900/50 backdrop-blur-sm text-white placeholder:text-gray-500 focus:border-green-500 shadow-lg"
                  />
                  <Button
                    type="submit"
                    className="absolute right-2 bg-green-600 hover:bg-green-700 rounded-full px-6"
                  >
                    Explore
                  </Button>
                </div>
                <p className="text-sm text-gray-400 mt-3">
                  We support 200+ major cities and regions in the United States.
                </p>
              </form>

              {/* Feature Pills */}
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <div className="flex items-center gap-2 bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-700">
                  <MapPin className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-200">200+ Cities</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-700">
                  <Clock className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-200">Book Instantly</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-700">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-200">Secure Payments</span>
                </div>
              </div>
            </div>

            {/* Scroll Indicator */}
            <button
              onClick={scrollToMap}
              className="absolute bottom-8 flex flex-col items-center gap-2 text-gray-400 hover:text-green-500 transition-colors animate-bounce"
            >
              <span className="text-sm font-medium">Explore the map</span>
              <ChevronDown className="h-6 w-6" />
            </button>
          </div>
        </section>
      </div>

      {/* Map Section - Full Viewport */}
      <section ref={mapSectionRef} className="h-screen flex flex-col">
        {/* Map Area */}
        <main className="flex-1 relative">
          <CityMap initialCenter={mapCenter} />
          <AdminPanel />
        </main>
      </section>
    </div>
  );
}
