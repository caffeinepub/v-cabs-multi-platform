import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, Navigation, Star, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SavedLocation } from "../types/vcabs";
import {
  type NominatimResult,
  reverseGeocode,
  saveLocation,
  searchLocations,
} from "../utils/locationHelper";

interface LocationSearchInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  onCoordinates?: (lat: number, lng: number) => void;
  isPickup?: boolean;
  city?: string;
  savedLocations?: SavedLocation[];
  placeholder?: string;
}

export default function LocationSearchInput({
  label,
  value,
  onChange,
  onCoordinates,
  isPickup,
  city,
  savedLocations = [],
  placeholder,
}: LocationSearchInputProps) {
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [showSaveName, setShowSaveName] = useState(false);
  const [saveName, setSaveName] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const cityLocations = savedLocations.filter(
    (l) => !city || l.city.toLowerCase() === city.toLowerCase(),
  );

  const doSearch = useCallback(async (q: string) => {
    setIsSearching(true);
    const res = await searchLocations(q);
    setResults(res);
    setIsSearching(false);
    setShowResults(true);
  }, []);

  useEffect(() => {
    if (value.length >= 3) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doSearch(value), 300);
    } else {
      setResults([]);
      setShowResults(false);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, doSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const addr = await reverseGeocode(latitude, longitude);
        onChange(addr);
        setSelectedLat(latitude);
        setSelectedLng(longitude);
        if (onCoordinates) onCoordinates(latitude, longitude);
        setIsDetecting(false);
        setShowResults(false);
      },
      () => {
        // Fallback for demo when permission denied
        onChange("Current Location (Demo: Mumbai, Maharashtra)");
        setSelectedLat(19.076);
        setSelectedLng(72.8777);
        if (onCoordinates) onCoordinates(19.076, 72.8777);
        setIsDetecting(false);
      },
      { timeout: 8000 },
    );
  };

  const pickResult = (r: NominatimResult) => {
    onChange(r.display_name);
    setSelectedLat(Number.parseFloat(r.lat));
    setSelectedLng(Number.parseFloat(r.lon));
    if (onCoordinates)
      onCoordinates(Number.parseFloat(r.lat), Number.parseFloat(r.lon));
    setResults([]);
    setShowResults(false);
  };

  const pickSaved = (loc: SavedLocation) => {
    onChange(loc.address);
    setSelectedLat(loc.lat);
    setSelectedLng(loc.lng);
    if (onCoordinates) onCoordinates(loc.lat, loc.lng);
    setShowResults(false);
  };

  const handleSave = () => {
    if (!saveName.trim() || selectedLat === null || selectedLng === null)
      return;
    saveLocation({
      id: `loc_${Date.now()}`,
      name: saveName.trim(),
      address: value,
      lat: selectedLat,
      lng: selectedLng,
      city: city ?? "Other",
    });
    setShowSaveName(false);
    setSaveName("");
    alert(`"${saveName}" saved to your ${city ?? ""} locations!`);
  };

  return (
    <div ref={wrapperRef} className="space-y-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
          <Input
            data-ocid="location.search_input"
            placeholder={placeholder ?? `Search ${label}...`}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setSelectedLat(null);
              setSelectedLng(null);
            }}
            onFocus={() => {
              if (value.length >= 3) setShowResults(true);
            }}
            className="pl-9"
          />
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setResults([]);
                setShowResults(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {isPickup && (
          <Button
            data-ocid="location.detect_button"
            type="button"
            variant="outline"
            size="icon"
            onClick={detectLocation}
            disabled={isDetecting}
            title="Detect my location"
            className="shrink-0 border-primary text-primary hover:bg-primary/10"
          >
            {isDetecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="rounded-lg border border-border bg-card shadow-lg overflow-hidden z-50 relative">
          {isSearching ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No results found
            </div>
          ) : (
            results.map((r, i) => (
              <button
                key={r.place_id}
                type="button"
                data-ocid={`location.result.item.${i + 1}`}
                onClick={() => pickResult(r)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent border-b border-border last:border-0 flex items-start gap-2"
              >
                <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <span className="line-clamp-2">{r.display_name}</span>
              </button>
            ))
          )}
        </div>
      )}

      {/* Save Location Button (shown when a location is selected) */}
      {selectedLat !== null && value && (
        <div className="flex items-center gap-2">
          {!showSaveName ? (
            <button
              type="button"
              data-ocid="location.save_button"
              onClick={() => setShowSaveName(true)}
              className="text-xs text-primary flex items-center gap-1 hover:underline"
            >
              <Star className="w-3 h-3" /> Save this location
            </button>
          ) : (
            <div className="flex gap-2 w-full">
              <Input
                placeholder="Name (e.g. Home, Office)"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                className="h-7 text-xs"
              />
              <Button
                type="button"
                size="sm"
                className="h-7 text-xs"
                onClick={handleSave}
              >
                Save
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setShowSaveName(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Saved Places */}
      {cityLocations.length > 0 && !showResults && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">
            ⭐ Saved Places ({city})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {cityLocations.slice(0, 6).map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => pickSaved(loc)}
                className="text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5 hover:bg-primary/20 transition-colors"
              >
                {loc.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
