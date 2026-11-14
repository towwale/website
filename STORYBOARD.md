# Towwala landing page storyboard (version 2)

Working title: **The tow, start to finish.**

The whole page is one trip. The 3D scene stays fixed behind every section, and scrolling
drives the truck along a single route: open highway, the breakdown, a toll plaza, a stretch
of roadside jobs, the city limits, a town street, and finally the garage where the car is
unloaded. Each page section is a stop on that route. All of it is in daylight, 6 AM to 5 PM,
on the yellow-and-white site.

## What was learned from the references

United Carriers and sites like it do three things: one continuous scene runs the full
length of the page, scroll position (not time) decides where the machine is, and the camera
changes its distance and angle for each section so the same subject keeps feeling new.
Their copy sits beside the scene in short blocks, never on top of the action.

## Cast

| Role | Model |
|---|---|
| Tow truck | 6-wheel cab-over flatbed (Isuzu-type), Towwala yellow, name on the doors |
| The car | Red Maruti Brezza (already on the site) |
| Roadside jobs | Mahindra Thar, Bajaj Pulsar, Tata Ace-type mini truck |
| Surroundings | Built in code: highway, kerbs, barriers, signboards, toll plaza, shopfronts, garage |

## Camera rules

- **Close and low** when a machine is doing something (hero, loading, unloading).
- **High and pulled back** when the truck is travelling, so it reads as a small truck on a long road.
- **Straight down** once, for the map-like cities stop.
- **Side-on with something passing in the foreground** to sell speed.
- Every stop ends on a different angle from the one before it.

## Scenes

| # | Page section | Time | Surroundings | What the truck does | Camera | Words on screen |
|---|---|---|---|---|---|---|
| 1 | Hero | 6 AM, sunrise | Open highway | Cruises, big in frame | Low, off the front corner | 24-hour towing across India; Book a tow |
| 2 | The call | 7 AM | Highway, a pin far ahead on the road | Keeps driving while the camera rises and pulls back until the truck is small and the road runs ahead to the pin | Lifts from low-and-close to high-and-far in one move | "A call comes in." Location shared on WhatsApp, price confirmed first |
| 3 | Breakdown | 8 AM | Hard shoulder: the red car with hazards on, warning triangle, cones, skid marks | Passes the car, stops, reverses up to it | Drops back down beside the car | STRANDED |
| 4 | Loading | 9 to 11 AM | Same spot | Bed rolls back, tilts, winch pulls the car on, bed levels, wheels strapped | Side-on, then from behind the car, then straight down | ROLL BACK, WINCH ON, STRAP DOWN |
| 5 | Charges | 12 noon | Toll plaza: booths, a gantry over the road | Drives up and through; the barrier lifts as the fare figures count up | High three-quarter chase, then under the gantry | Towing charges on the toll boards |
| 6 | Services | 1 to 2 PM | A stretch of verge with six small scenes | Drives past each one: a bike on a carrier, a jeep on a jack with a flat, a car on jump leads, a fuel can at a dry tank, a locked car, a crane lifting a wreck | Side-on tracking; each scene slides through the frame | One service card per scene, tap to book it |
| 7 | Cities | 3 PM | Green highway distance boards, road forking | Small truck on a long road | Straight down, like a map | Towing across India, city names on the boards |
| 8 | Questions | 4 PM | Town street: shopfronts, a signal, parked scooters | Slows, stops at the signal, moves on | Level, from across the street | Asked before booking |
| 9 | Delivered | 5 PM | The garage: forecourt, open shutter, signboard | Pulls in, bed tilts, car rolls off and into the bay | Close and low again, mirroring the loading | DELIVERED |
| 10 | Booking | 5 PM | Same forecourt, truck empty and waiting | Sits with the beacon on; when the visitor slides to send, it pulls away | Wide, truck to one side, form on the other | Tell us where you are |
| 11 | Footer | | Road running on | Truck small in the distance | High and far | Gaadi ruk gayi? Hum aa rahe hain. |

## How it works on the page

- The truck moves only when the page is scrolled, and its wheels and the road match the
  distance. Stop scrolling and it stops; scroll up and it reverses along the route.
- A thin route line down the side shows the stops, with a dot for the truck. Tapping a stop
  takes the page there.
- Copy sits in white panels on the side the truck is not on. Nothing important is ever
  printed over the truck.
- On phones the story is the same, with the camera closer and the panels as cards along
  the bottom.

## Build order

1. **Route and camera first.** The truck travelling the whole page through all eleven
   stops, with plain blocks standing in for buildings. This is the part to judge early.
2. Real surroundings: toll plaza, signboards, town street, garage.
3. The six roadside jobs and their vehicles.
4. The 6-wheel truck swap.
5. Phone layout and polish.

## Open points

1. The 6-wheel model is a cargo flatbed; its bed must be cut free to slide and tilt. If it
   will not separate cleanly, the fallback is the current truck with one rear axle removed.
2. Surroundings are built in code, so they will look clean and simple beside the detailed
   truck and car, not photographic.
3. This replaces the current layout of every section, not only the top of the page.
