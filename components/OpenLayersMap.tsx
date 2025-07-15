"use client"

import { useEffect, useRef } from "react"
import type { Tournament } from "@/types/tournament"
import Map from "ol/Map"
import View from "ol/View"
import TileLayer from "ol/layer/Tile"
import VectorLayer from "ol/layer/Vector"
import VectorSource from "ol/source/Vector"
import OSM from "ol/source/OSM"
import Feature from "ol/Feature"
import Point from "ol/geom/Point"
import { Style, Icon } from "ol/style"
import { fromLonLat } from "ol/proj"
import Overlay from "ol/Overlay"

interface OpenLayersMapProps {
  tournaments: Tournament[]
  initialCenter?: [number, number]
  initialZoom?: number
}

export function OpenLayersMap({
  tournaments,
  initialCenter = [10.0, 54.0], // Default to center of Europe
  initialZoom = 4,
}: OpenLayersMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<Map | null>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<Overlay | null>(null)

  console.log("OpenLayersMap: Component rendered with tournaments:", tournaments.length)
  console.log("OpenLayersMap: Initial center:", initialCenter, "Initial zoom:", initialZoom)

  useEffect(() => {
    console.log("OpenLayersMap: useEffect triggered for map initialization")

    if (!mapRef.current) {
      console.error("OpenLayersMap: Map container ref not available")
      return
    }

    // Clean up existing map
    if (mapInstanceRef.current) {
      console.log("OpenLayersMap: Cleaning up existing map instance")
      mapInstanceRef.current.setTarget(undefined)
      mapInstanceRef.current = null
    }

    try {
      console.log("OpenLayersMap: Creating new map instance")

      // Create popup overlay
      if (popupRef.current) {
        overlayRef.current = new Overlay({
          element: popupRef.current,
          autoPan: {
            animation: {
              duration: 250,
            },
          },
        })
      }

      // Create vector source for tournament markers
      const vectorSource = new VectorSource()

      // Add tournament features
      tournaments.forEach((tournament) => {
        if (tournament.coordinates && tournament.coordinates.length === 2) {
          console.log(`OpenLayersMap: Adding marker for ${tournament.name} at`, tournament.coordinates)

          const feature = new Feature({
            geometry: new Point(fromLonLat(tournament.coordinates)),
            tournament: tournament,
          })

          feature.setStyle(
            new Style({
              image: new Icon({
                anchor: [0.5, 1],
                src:
                  "data:image/svg+xml;charset=utf-8," +
                  encodeURIComponent(`
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#3B82F6"/>
                    <circle cx="12" cy="9" r="2.5" fill="white"/>
                  </svg>
                `),
                scale: 1,
              }),
            }),
          )

          vectorSource.addFeature(feature)
        } else {
          console.warn(`OpenLayersMap: Invalid coordinates for tournament ${tournament.name}:`, tournament.coordinates)
        }
      })

      // Create vector layer
      const vectorLayer = new VectorLayer({
        source: vectorSource,
      })

      // Create map
      const map = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
          vectorLayer,
        ],
        view: new View({
          center: fromLonLat(initialCenter),
          zoom: initialZoom,
        }),
      })

      // Add overlay if it exists
      if (overlayRef.current) {
        map.addOverlay(overlayRef.current)
      }

      // Add click handler for popups
      map.on("singleclick", (evt) => {
        const feature = map.forEachFeatureAtPixel(evt.pixel, (feature) => feature)

        if (feature && popupRef.current && overlayRef.current) {
          const tournament = feature.get("tournament") as Tournament
          const coordinates = feature.getGeometry()?.getCoordinates()

          if (tournament && coordinates) {
            console.log("OpenLayersMap: Showing popup for tournament:", tournament.name)

            popupRef.current.innerHTML = `
              <div class="bg-white p-3 rounded-lg shadow-lg border max-w-xs">
                <h3 class="font-semibold text-sm mb-1">${tournament.name}</h3>
                <p class="text-xs text-gray-600 mb-1">${tournament.location}</p>
                <p class="text-xs text-gray-600 mb-2">${new Date(tournament.date).toLocaleDateString()}</p>
                <div class="flex flex-wrap gap-1">
                  ${tournament.disciplines.map((d) => `<span class="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">${d.name}</span>`).join("")}
                </div>
              </div>
            `

            overlayRef.current.setPosition(coordinates)
          }
        } else {
          // Hide popup if clicking elsewhere
          if (overlayRef.current) {
            overlayRef.current.setPosition(undefined)
          }
        }
      })

      mapInstanceRef.current = map
      console.log("OpenLayersMap: Map instance created successfully")
    } catch (error) {
      console.error("OpenLayersMap: Error creating map:", error)
    }

    // Cleanup function
    return () => {
      console.log("OpenLayersMap: Cleaning up map on unmount")
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined)
        mapInstanceRef.current = null
      }
    }
  }, [tournaments, initialCenter, initialZoom])

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapRef}
        className="w-full h-full min-h-[400px] rounded-lg overflow-hidden"
        style={{ background: "#f0f0f0" }}
      />
      <div ref={popupRef} className="absolute pointer-events-none" />
    </div>
  )
}
