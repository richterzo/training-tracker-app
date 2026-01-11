"use client"

import { useState, useCallback, useRef, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { MapPin, X } from "lucide-react"
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"]

const mapContainerStyle = {
  width: "100%",
  height: "400px",
}

const defaultCenter = {
  lat: 45.4642, // Milan default
  lng: 9.19,
}

interface LocationPickerProps {
  location: string
  locationLat: number | null
  locationLng: number | null
  onLocationChange: (location: string) => void
  onCoordinatesChange: (lat: number | null, lng: number | null) => void
  disabled?: boolean
}

export function LocationPicker({
  location,
  locationLat,
  locationLng,
  onLocationChange,
  onCoordinatesChange,
  disabled,
}: LocationPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mapCenter, setMapCenter] = useState(
    locationLat && locationLng ? { lat: locationLat, lng: locationLng } : defaultCenter
  )
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(
    locationLat && locationLng ? { lat: locationLat, lng: locationLng } : null
  )
  const mapRef = useRef<google.maps.Map | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries,
  })

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map

      if (searchInputRef.current) {
        autocompleteRef.current = new google.maps.places.Autocomplete(searchInputRef.current, {
          fields: ["formatted_address", "geometry", "name"],
        })

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current?.getPlace()
          if (place?.geometry?.location) {
            const lat = place.geometry.location.lat()
            const lng = place.geometry.location.lng()
            const newCenter = { lat, lng }

            setMapCenter(newCenter)
            setMarkerPosition(newCenter)
            onLocationChange(place.formatted_address || place.name || "")
            onCoordinatesChange(lat, lng)

            map.setCenter(newCenter)
            map.setZoom(15)
          }
        })
      }
    },
    [onLocationChange, onCoordinatesChange]
  )

  const onMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat()
        const lng = e.latLng.lng()
        const position = { lat, lng }

        setMarkerPosition(position)
        onCoordinatesChange(lat, lng)

        // Reverse geocode to get address
        const geocoder = new google.maps.Geocoder()
        geocoder.geocode({ location: position }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            onLocationChange(results[0].formatted_address)
          }
        })
      }
    },
    [onLocationChange, onCoordinatesChange]
  )

  const handleClearLocation = () => {
    setMarkerPosition(null)
    onLocationChange("")
    onCoordinatesChange(null, null)
  }

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          const newCenter = { lat, lng }

          setMapCenter(newCenter)
          setMarkerPosition(newCenter)
          onCoordinatesChange(lat, lng)

          // Reverse geocode
          const geocoder = new google.maps.Geocoder()
          geocoder.geocode({ location: newCenter }, (results, status) => {
            if (status === "OK" && results && results[0]) {
              onLocationChange(results[0].formatted_address)
            }
          })

          if (mapRef.current) {
            mapRef.current.setCenter(newCenter)
            mapRef.current.setZoom(15)
          }
        },
        (error) => {
          console.error("Error getting location:", error)
        }
      )
    }
  }

  // Fallback if no API key or error
  if (!apiKey || loadError) {
    return (
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="location"
            placeholder="e.g., Park, Gym, Home"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            disabled={disabled}
            className="pl-9"
          />
        </div>
        {!apiKey && (
          <p className="text-xs text-muted-foreground">
            Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local for map features
          </p>
        )}
        {loadError && (
          <p className="text-xs text-muted-foreground">Google Maps not available. Enter location manually.</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="location">Location</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="location"
            ref={searchInputRef}
            placeholder="Search for a location..."
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            disabled={disabled}
            className="pl-9"
          />
        </div>
        {location && (
          <Button type="button" variant="outline" size="icon" onClick={handleClearLocation} disabled={disabled}>
            <X className="h-4 w-4" />
          </Button>
        )}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" disabled={disabled || !isLoaded}>
              <MapPin className="mr-2 h-4 w-4" />
              Map
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Select Location</DialogTitle>
            </DialogHeader>
            {isLoaded ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    ref={searchInputRef}
                    placeholder="Search for a location..."
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={handleUseCurrentLocation}>
                    Use Current
                  </Button>
                </div>
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={mapCenter}
                  zoom={markerPosition ? 15 : 10}
                  onLoad={onMapLoad}
                  onClick={onMapClick}
                  options={{
                    disableDefaultUI: false,
                    zoomControl: true,
                    streetViewControl: false,
                    mapTypeControl: false,
                  }}
                >
                  {markerPosition && <Marker position={markerPosition} draggable />}
                </GoogleMap>
                {markerPosition && (
                  <div className="text-sm text-muted-foreground">
                    Selected: {markerPosition.lat.toFixed(6)}, {markerPosition.lng.toFixed(6)}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsOpen(false)}>Confirm</Button>
                </div>
              </div>
            ) : (
              <div className="flex h-[400px] items-center justify-center">
                <p>Loading map...</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
      {locationLat && locationLng && (
        <p className="text-xs text-muted-foreground">
          Location: {locationLat.toFixed(6)}, {locationLng.toFixed(6)}
        </p>
      )}
    </div>
  )
}
