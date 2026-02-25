import React, { useCallback, useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { WifiNetwork } from "@/interface/IWifiNetwork";
import { sanitizeVirtualKeyboardInput } from "@/lib/inputSanitizer";

const WifiNetworks: React.FC = () => {
  const [networks, setNetworks] = useState<WifiNetwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<WifiNetwork | null>(
    null
  );
  const [password, setPassword] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectMessage, setConnectMessage] = useState<string | null>(null);

  const fetchNetworks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<WifiNetwork[]>("/wifi/networks");
      setNetworks(data);
    } catch (err) {
      console.error(err);
      setError("Nie udalo sie pobrac listy sieci WiFi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNetworks();
  }, [fetchNetworks]);

  const requiresPassword = (security?: string | null) => {
    if (!security) {
      return false;
    }
    const lower = security.toLowerCase();
    return !(lower.includes("open") || lower.includes("none"));
  };

  const openConnect = (network: WifiNetwork) => {
    setSelectedNetwork(network);
    setPassword("");
    setConnectMessage(null);
  };

  const closeConnect = () => {
    setSelectedNetwork(null);
    setPassword("");
    setConnectMessage(null);
  };

  const handleConnect = async () => {
    if (!selectedNetwork?.ssid) {
      return;
    }
    const normalizedPassword = sanitizeVirtualKeyboardInput(password);
    setConnecting(true);
    setConnectMessage(null);
    try {
      await api.post("/wifi/connect", {
        ssid: selectedNetwork.ssid,
        password: normalizedPassword || undefined,
      });
      setConnectMessage("Polaczono. Siec bedzie zapamietana przez 12h.");
    } catch (err) {
      console.error(err);
      setConnectMessage("Nie udalo sie polaczyc z siecia.");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="p-6 max-h-[80vh] overflow-y-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-contrast text-xl">
          Dostepne sieci WiFi
        </h2>
        <Button onClick={fetchNetworks} className="bg-contrast">
          Odswiez
        </Button>
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="text-contrast font-medium">{error}</div>
      )}

      {!loading && !error && networks.length === 0 && (
        <div className="text-contrast font-medium">
          Brak dostepnych sieci WiFi.
        </div>
      )}

      {!loading && !error && networks.length > 0 && (
        <div className="space-y-3">
          {networks.map((network) => (
            <div
              key={`${network.ssid}-${network.bssid ?? "unknown"}`}
              className="flex items-center justify-between p-4 bg-back border-r-3 border-r-acent border-b-4 border-b-acent rounded-xl shadow-md"
            >
              <div>
                <div className="text-lg font-semibold text-contrast">
                  {network.ssid ? network.ssid : "Hidden network"}
                </div>
                <div className="text-sm text-contrast/80">
                  {network.security ?? "Open"}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-28 h-2 bg-white/70 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-acent"
                    style={{ width: `${network.signal ?? 0}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-contrast w-10 text-right">
                  {network.signal ?? 0}%
                </span>
                <Button
                  onClick={() => openConnect(network)}
                  className="bg-contrast"
                  disabled={!network.ssid}
                >
                  Polacz
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedNetwork && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-30">
          <div className="w-full max-w-md bg-back rounded-2xl shadow-xl p-6 space-y-4">
            <div>
              <div className="text-lg font-semibold text-contrast">
                Polaczenie z siecia
              </div>
              <div className="text-sm text-contrast/80">
                {selectedNetwork.ssid || "Hidden network"}
              </div>
            </div>

            {requiresPassword(selectedNetwork.security) && (
              <div className="space-y-2">
                <label className="text-sm text-contrast">Haslo</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Wpisz haslo"
                />
              </div>
            )}

            {connectMessage && (
              <div className="text-sm text-contrast">{connectMessage}</div>
            )}

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={closeConnect}>
                Anuluj
              </Button>
              <Button
                onClick={handleConnect}
                className="bg-contrast"
                disabled={
                  connecting ||
                  (requiresPassword(selectedNetwork.security) && !password)
                }
              >
                {connecting ? "Laczenie..." : "Polacz"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WifiNetworks;
