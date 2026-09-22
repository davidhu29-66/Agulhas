import { blankStages, Device } from "./types";

const make = (tag: string, kks: string, type: string, subsystem: string, location: string): Device => ({
  id: tag.toLowerCase().replace(/[^a-z0-9]+/g, "-"), tag, kks, type, subsystem, location, stages: blankStages()
});

export const seedDevices: Device[] = [
  make("CAM01", "10BFA1001-CAT6", "LPR camera", "CCTV", "Entrance Gate LPR 1"),
  make("CAM02", "10BFA1002-CAT6", "LPR camera", "CCTV", "Entrance Gate LPR 2"),
  make("CAM03", "10BFA1003-CAT6", "Thermal camera", "CCTV", "Perimeter Fence Kiosk 03"),
  make("CAM07", "10BFA1007-CAT6", "PTZ camera", "CCTV", "High-View Pole 07"),
  make("ACS-UP-01", "2001-CAT6", "Controller uplink", "ACS", "Mercury LP1502 .200"),
  make("CR01", "3001-MY3P", "Card reader", "ACS", "Main Gate Turnstile IN"),
  make("CR02", "3002-MY3P", "Card reader", "ACS", "Main Gate Turnstile OUT"),
  make("BIO-01", "3017-MY3P", "Biometric reader", "ACS", "Main Gate Vehicle Access"),
  make("MAGLOCK-01", "3022-MY2P", "300kg maglock", "ACS", "Access Door 1 — confirm on site"),
  make("BGU-01", "", "Break-glass unit", "ACS", "Access Door 1 — confirm on site"),
  make("KIOSK03", "00MKG29-KIOSK03", "Field kiosk", "CCTV", "Perimeter Fence Pole 03"),
  make("ALM01", "00EYD12-ALM01", "RISCO alarm panel", "Alarm", "Control Building"),
  make("NVR01", "00EYD12-NVR01", "Avigilon NVR6", "Head-end", "Guard House Core Rack"),
  make("PSIM01", "00EYD12-PSIM01", "WinGuard X5 server", "Head-end", "Guard House Core Rack")
];
