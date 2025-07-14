"use client"

import { useRef, useEffect } from "react"
import Map from "ol/Map"
import View from "ol/View"
import TileLayer from "ol/layer/Tile"
import OSM from "ol/source/OSM"
import Feature from "ol/Feature"
import Point from "ol/geom/Point"
import { fromLonLat } from "ol/proj"
import { Style, Icon } from "ol/style"
import VectorLayer from "ol/layer/Vector"
import VectorSource from "ol/source/Vector"
import Overlay from "ol/Overlay"
import { defaults as defaultInteractions, MouseWheelZoom } from "ol/interaction"
import { platformModifierKeyOnly } from "ol/events/condition"
import type { Tournament, DisciplineDetail } from "@/types/tournament"
import { getTournamentTypeColor } from "@/services/tournament-api"

interface OpenLayersMapProps {
  tournaments: Tournament[]
  initialZoom?: number
  initialCenter?: [number, number] // [longitude, latitude]
}

export function OpenLayersMap({ tournaments, initialZoom = 2, initialCenter }: OpenLayersMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<Map | null>(null)
  const vectorSource = useRef<VectorSource | null>(null)
  const popupOverlay = useRef<Overlay | null>(null)

  // Effect for map initialization (runs once on mount)
  useEffect(() => {
    if (!mapRef.current) return

    // Determine initial center and zoom based on provided props
    let center = fromLonLat([0, 40]) // Default global center
    let zoom = initialZoom

    if (initialCenter) {
      center = fromLonLat(initialCenter)
      zoom = Math.max(initialZoom, 4) // A reasonable zoom for a country
    } else if (tournaments && tournaments.length > 0) {
      center = fromLonLat(tournaments[0].coordinates)
      zoom = Math.max(initialZoom, 8) // Zoom in more if a specific tournament is provided
    }

    // Create default interactions, explicitly disabling regular mouse wheel zoom
    const interactions = defaultInteractions({ mouseWheelZoom: false }).extend([
      // Add a new MouseWheelZoom interaction that requires the Ctrl key
      new MouseWheelZoom({
        condition: platformModifierKeyOnly, // Requires Ctrl (or Cmd on Mac)
      }),
    ])

    const initialMap = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: center,
        zoom: zoom,
      }),
      interactions: interactions, // Apply custom interactions
    })
    mapInstance.current = initialMap

    // Initialize vector source for markers
    const initialVectorSource = new VectorSource()
    const vectorLayer = new VectorLayer({
      source: initialVectorSource,
    })
    initialMap.addLayer(vectorLayer)
    vectorSource.current = initialVectorSource

    // Initialize popup overlay
    if (popupRef.current) {
      const initialPopupOverlay = new Overlay({
        element: popupRef.current,
        autoPan: false,
        positioning: "bottom-center",
        offset: [0, -15],
      })
      initialMap.addOverlay(initialPopupOverlay)
      popupOverlay.current = initialPopupOverlay

      // Add event listener for the close button
      const closer = popupRef.current.querySelector(".ol-popup-closer")
      if (closer) {
        closer.onclick = () => {
          initialPopupOverlay.setPosition(undefined)
          closer.blur()
          return false
        }
      }
    }

    // Handle map clicks for popups and centering
    initialMap.on("click", (event) => {
      const feature = initialMap.forEachFeatureAtPixel(event.pixel, (feature) => feature)
      if (feature && feature.get("tournament")) {
        const tournament = feature.get("tournament") as Tournament
        const coordinates = feature.getGeometry()?.getCoordinates()

        if (coordinates) {
          // Center map on the clicked feature
          initialMap.getView().animate({
            center: coordinates,
            duration: 250,
            zoom: Math.max(initialMap.getView().getZoom() || 2, 5),
          })

          // Show popup
          if (popupRef.current && popupOverlay.current) {
            // Make the entire popup content a link to the tournament details page
            popupRef.current.innerHTML = `
              <a href="#" class="ol-popup-closer"></a>
              <a href="/tournaments/${tournament.id}" class="block no-underline text-current">
                <div class="bg-white p-2 rounded shadow-md text-sm">
                  <div class="font-semibold text-blue-600 hover:underline">${tournament.name}</div>
                  <div>${tournament.location}</div>
                  <div>${new Date(tournament.date).toLocaleDateString()}</div>
                  <div class="flex flex-wrap gap-1 mt-1">
                    ${tournament.disciplines.map((d: DisciplineDetail) => `<span class="text-xs px-1.5 py-0.5 rounded-full ${getTournamentTypeColor(d.type)}">${d.name} (${d.type})</span>`).join("")}
                  </div>
                </div>
              </a>
            `
            // Re-attach click listener for the new closer element
            const closer = popupRef.current.querySelector(".ol-popup-closer")
            if (closer) {
              closer.onclick = () => {
                popupOverlay.current?.setPosition(undefined)
                closer.blur()
                return false
              }
            }
            popupOverlay.current.setPosition(coordinates)
          }
        }
      } else {
        popupOverlay.current?.setPosition(undefined) // Hide popup if no feature clicked
      }
    })

    // Cleanup on unmount
    return () => {
      if (mapInstance.current) {
        mapInstance.current.setTarget(undefined)
        mapInstance.current = null
      }
    }
  }, [tournaments, initialZoom, initialCenter])

  // Effect for updating markers when tournaments prop changes
  useEffect(() => {
    if (vectorSource.current) {
      vectorSource.current.clear()
      tournaments.forEach((tournament) => {
        const marker = new Feature({
          geometry: new Point(fromLonLat(tournament.coordinates)),
        })
        marker.setStyle(
          new Style({
            image: new Icon({
              anchor: [0.5, 1], // Anchor at the bottom center of the icon
              src: "https://openlayers.org/en/latest/examples/data/icon.png", // Default OpenLayers marker icon
              scale: 0.7,
            }),
          }),
        )
        marker.set("tournament", tournament) // Store tournament data on the feature
        vectorSource.current.addFeature(marker)
      })
    }
  }, [tournaments])

  return (
    <div className="relative h-full">
      <div ref={mapRef} className="h-full w-full rounded-lg z-0"></div>
      <div ref={popupRef} className="ol-popup absolute bottom-0 left-1/2 -translate-x-1/2 mb-2"></div>
      <style jsx>{`
        .ol-popup {
          position: absolute;
          background-color: white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          padding: 15px;
          border-radius: 10px;
          border: 1px solid #cccccc;
          transform: translateX(-50%); /* Center the popup horizontally relative to its anchor point */
          bottom: 12px; /* Adjusted slightly for better visual */
          min-width: 280px;
        }
        .ol-popup:after, .ol-popup:before {
          top: 100%;
          border: solid transparent;
          content: " ";
          height: 0;
          width: 0;
          position: absolute;
          pointer-events: none;
          left: 50%; /* Center the arrow relative to the popup's width */
          transform: translateX(-50%); /* Further center the arrow */
        }
        .ol-popup:after {
          border-top-color: white;
          border-width: 10px;
          margin-left: 0; /* Reset margin-left */
        }
        .ol-popup:before {
          border-top-color: #cccccc;
          border-width: 11px;
          margin-left: 0; /* Reset margin-left */
        }
        .ol-popup-closer {
          text-decoration: none;
          position: absolute;
          top: 2px;
          right: 8px;
          color: #333; /* Make sure it's visible */
          font-weight: bold;
          font-size: 1.2em;
        }
        .ol-popup-closer:after {
          content: "✖";
        }
      `}</style>
    </div>
  )
}
