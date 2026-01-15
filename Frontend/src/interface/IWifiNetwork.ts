export interface WifiNetwork {
  ssid: string;
  signal?: number | null;
  security?: string | null;
  bssid?: string | null;
  frequency?: number | null;
}
