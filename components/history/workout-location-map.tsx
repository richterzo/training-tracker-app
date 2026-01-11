"use client"

import { useJsApiLoader, GoogleMap, Marker } from "@react-google-maps/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin } from "lucide-react"

const mapContainerStyle = {
  width: "100%",
  height: "300px",
}

interface WorkoutLocationMapProps {
  location: string | null
  locationLat: number | null
  locationLng: number | null
}

export function WorkoutLocationMap({ location, locationLat, locationLng }: WorkoutLocationMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
  })

  if (!locationLat || !locationLng || !apiKey || loadError || !isLoaded) {
    return null
  }

  const center = {
    lat: locationLat,
    lng: locationLng,
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        {location && <p className="mb-4 text-sm text-muted-foreground">{location}</p>}
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={15}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
          }}
        >
          <Marker position={center} />
        </GoogleMap>
      </CardContent>
    </Card>
  )
}
