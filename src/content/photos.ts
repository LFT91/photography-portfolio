export type PhotoId = string;

export type PhotoRecord = {
  title: string;
  src: string;
  displayScale?: number;
};

/** Canonical photograph records. One metadata object per photograph. */
export const photos = {
  "aerial-view": {
    title: "Aerial View",
    src: "/images/DJI_0117-HDR-Edit.jpg",
    displayScale: 0.84,
  },
  "coastal-cove": {
    title: "Coastal Cove",
    src: "/images/coastal-cove.jpg",
  },
  "forest-divide": {
    title: "Forest Divide",
    src: "/images/trees.jpg",
    displayScale: 0.83,
  },
  "kayaks-in-the-rock-pool": {
    title: "Kayaks in the Rock Pool",
    src: "/images/nature/kayaks-in-the-rock-pool.jpg",
  },
  "mountain-village": {
    title: "Mountain Village",
    src: "/images/travel/mountain-village.jpg",
  },
  "volcanic-peaks": {
    title: "Volcanic Peaks",
    src: "/images/nature/volcanic-peaks.jpg",
  },
  "rift-above-the-sea": {
    title: "Rift Above the Sea",
    src: "/images/nature/rift-above-the-sea.jpg",
  },
  "glacier-watch": {
    title: "Glacier Watch",
    src: "/images/nature/glacier-watch.jpg",
  },
  "alpine-church": {
    title: "Alpine Church",
    src: "/images/travel/alpine-church.jpg",
    displayScale: 0.83,
  },
  "glacial-lagoon": {
    title: "Glacial Lagoon",
    src: "/images/travel/glacial-lagoon.jpg",
  },
  "diamond-beach": {
    title: "Diamond Beach",
    src: "/images/travel/diamond-beach.jpg",
    displayScale: 0.84,
  },
  "ice-shore": {
    title: "Ice Shore",
    src: "/images/nature/ice-shore.jpg",
  },
  "the-lookout": {
    title: "The Lookout",
    src: "/images/nature/the-lookout.jpg",
  },
  "cave-of-two-waters": {
    title: "Cave of Two Waters",
    src: "/images/nature/cave-of-two-waters.jpg",
  },
  "valley-light": {
    title: "Valley Light",
    src: "/images/A7303942-Edit2.jpg",
  },
  "message-on-the-shore": {
    title: "Message on the Shore",
    src: "/images/nature/message-on-the-shore.jpg",
  },
  "crater-chain": {
    title: "Crater Chain",
    src: "/images/nature/crater-chain.jpg",
  },
  "at-the-falls": {
    title: "At the Falls",
    src: "/images/nature/at-the-falls.jpg",
  },
  "kirkjufell-falls": {
    title: "Kirkjufell Falls",
    src: "/images/nature/kirkjufell-falls.jpg",
  },
  "veiled-valley": {
    title: "Veiled Valley",
    src: "/images/nature/veiled-valley.jpg",
  },
  "pasture-rainbow": {
    title: "Pasture Rainbow",
    src: "/images/nature/pasture-rainbow.jpg",
  },
  "winter-crossing": {
    title: "Winter Crossing",
    src: "/images/nature/winter-crossing.jpg",
  },
  "white-peacock": {
    title: "White Peacock",
    src: "/images/nature/white-peacock.jpg",
  },
  "black-shore": {
    title: "Black Shore",
    src: "/images/nature/black-shore.jpg",
  },
  "island-at-dusk": {
    title: "Island at Dusk",
    src: "/images/nature/island-at-dusk.jpg",
  },
  "afterimage-at-sunset": {
    title: "Afterimage at Sunset",
    src: "/images/nature/afterimage-at-sunset.jpg",
  },
  "island-outlook": {
    title: "Island Outlook",
    src: "/images/travel/island-outlook.jpg",
    displayScale: 0.87,
  },
  "the-bridge-keeper": {
    title: "The Bridge Keeper",
    src: "/images/nature/the-bridge-keeper.jpg",
  },
  "two-in-the-mist": {
    title: "Two in the Mist",
    src: "/images/nature/two-in-the-mist.jpg",
  },
  "boathouse-under-storm": {
    title: "Boathouse Under Storm",
    src: "/images/nature/boathouse-under-storm.jpg",
  },
  "white-silence": {
    title: "White Silence",
    src: "/images/nature/white-silence.jpg",
  },
  "red-tuk-tuk-in-fog": {
    title: "Red Tuk-Tuk in Fog",
    src: "/images/nature/red-tuk-tuk-in-fog.jpg",
  },
  "deer-herd": {
    title: "Deer Herd",
    src: "/images/nature/deer-herd.jpg",
  },
  "refuge-below-the-peaks": {
    title: "Refuge Below the Peaks",
    src: "/images/nature/refuge-below-the-peaks.jpg",
  },
  "stags-clash": {
    title: "Stags Clash",
    src: "/images/nature/stags-clash.jpg",
  },
  "city-hall-curve": {
    title: "City Hall Curve",
    src: "/images/urban/city-hall-curve.jpg",
  },
  "shard-between-curves": {
    title: "Shard Between Curves",
    src: "/images/urban/shard-between-curves.jpg",
  },
  "between-the-curves": {
    title: "Between the Curves",
    src: "/images/urban/between-the-curves.jpg",
  },
  "window-grid": {
    title: "Window Grid",
    src: "/images/after-dark/window-grid.jpg",
    displayScale: 0.84,
  },
  "city-lights": {
    title: "City Lights",
    src: "/images/after-dark/A7302924.jpg",
    displayScale: 0.85,
  },
  "marina-viaduct": {
    title: "Marina Viaduct",
    src: "/images/urban/marina-viaduct.jpg",
  },
  "oia-after-dark": {
    title: "Oia After Dark",
    src: "/images/urban/oia-after-dark.jpg",
  },
  "night-orbit": {
    title: "Night Orbit",
    src: "/images/image_6483441.JPG",
    displayScale: 0.93,
  },
  "illuminated-dome": {
    title: "Illuminated Dome",
    src: "/images/urban/illuminated-dome.jpg",
  },
  "red-witness": {
    title: "Red Witness",
    src: "/images/urban/red-witness.jpg",
  },
  "blue-domes": {
    title: "Blue Domes",
    src: "/images/after-dark/78F56291-F28E-42FD-9CDC-C4C33CF10530.jpg",
  },
  "quiet-hours": {
    title: "Quiet Hours",
    src: "/images/after-dark-cover.jpg",
  },
  "fortnum-night": {
    title: "Fortnum Night",
    src: "/images/urban/fortnum-night.jpg",
    displayScale: 0.83,
  },
  "moulin-rouge": {
    title: "Moulin Rouge",
    src: "/images/after-dark/moulin-rouge.jpg",
    displayScale: 0.83,
  },
  "red-corner": {
    title: "Red Corner",
    src: "/images/urban/red-corner.jpg",
  },
  "bus-reflection": {
    title: "Bus Reflection",
    src: "/images/urban/bus-reflection.jpg",
  },
  "light-ring": {
    title: "Light Ring",
    src: "/images/after-dark/12093E8F-8DE7-4233-96E1-28D8270D0C25.jpg",
    displayScale: 0.78,
  },
  "night-corner": {
    title: "Night Corner",
    src: "/images/after-dark/2F2E8CA6-A1DB-44ED-8879-E56955B99845.jpg",
  },
  "fog-brake-lights": {
    title: "Fog Brake Lights",
    src: "/images/after-dark/fog-brake-lights.jpg",
    displayScale: 0.83,
  },
  "tower-bridge-dissolving": {
    title: "Tower Bridge, Dissolving",
    src: "/images/urban/tower-bridge-dissolving.jpg",
  },
  "fog-petrol": {
    title: "Fog Petrol",
    src: "/images/after-dark/fog-petrol.jpg",
    displayScale: 0.83,
  },
  "underground-rush": {
    title: "Underground Rush",
    src: "/images/urban/underground-rush.jpg",
  },
  "snow-street": {
    title: "Snow Street",
    src: "/images/urban/snow-street.jpg",
  },
  "sun-through-tower-bridge": {
    title: "Sun Through Tower Bridge",
    src: "/images/urban/sun-through-tower-bridge.jpg",
  },
  "arch-view": {
    title: "Arch View",
    src: "/images/nature/arch-view.jpg",
  },
  "fog-station-pass": {
    title: "Fog Station Pass",
    src: "/images/after-dark/fog-station-pass.jpg",
  },
  "long-shadow": {
    title: "Long Shadow",
    src: "/images/urban/long-shadow.jpg",
  },
  "city-hall-reflection": {
    title: "City Hall Reflection",
    src: "/images/urban/city-hall-reflection.jpg",
  },
  "at-the-monument": {
    title: "At the Monument",
    src: "/images/urban/at-the-monument.jpg",
  },
  "westminster-cyclist": {
    title: "Westminster Cyclist",
    src: "/images/urban/westminster-cyclist.jpg",
  },
  "at-the-threshold": {
    title: "At the Threshold",
    src: "/images/urban/at-the-threshold.jpg",
  },
  "through-the-arch": {
    title: "Through the Arch",
    src: "/images/urban/through-the-arch.jpg",
  },
  "at-the-memorial": {
    title: "At the Memorial",
    src: "/images/urban/at-the-memorial.jpg",
  },
  "aerial-panorama": {
    title: "Aerial Panorama",
    src: "/images/DJI_0464-HDR-Pano-Edit.jpg",
  },
  "empty-platform": {
    title: "Empty Platform",
    src: "/images/urban/empty-platform.jpg",
  },
  "street-mirror": {
    title: "Street Mirror",
    src: "/images/urban/street-mirror.jpg",
  },
  "the-long-path": {
    title: "The Long Path",
    src: "/images/urban/the-long-path.jpg",
  },
  "hallgrimskirkja": {
    title: "Hallgrimskirkja",
    src: "/images/after-dark/D28062C8-D542-4F6F-995E-DAD7790A7EC0.jpg",
  },
  "aurora-boat": {
    title: "Aurora Boat",
    src: "/images/after-dark/DECBAFBD-1653-43A6-80AE-E599A9E65066.jpg",
    displayScale: 0.83,
  },
  "comet-field": {
    title: "Comet Field",
    src: "/images/after-dark/A7308148-2.jpg",
  },
  "milky-way-over-the-house": {
    title: "Milky Way over the House",
    src: "/images/astro/milky-way-over-the-house.jpg",
  },
  "aurora-watch": {
    title: "Aurora Watch",
    src: "/images/after-dark/C884E0B9-73BF-4C3B-AD2A-87F66FA575E1.jpg",
    displayScale: 0.82,
  },
  "aurora-cabin": {
    title: "Aurora Cabin",
    src: "/images/after-dark/DD5ECB7C-5ACC-455F-B574-0B1976D659C4.jpg",
  },
  "star-trails-path": {
    title: "Star Trails Path",
    src: "/images/after-dark/26CDFA76-BFEA-4266-93DC-7A4BA3512337.jpg",
    displayScale: 0.69,
  },
  "kirkjufell-aurora": {
    title: "Kirkjufell Aurora",
    src: "/images/after-dark/_A736530-2-DeNoiseAI-severe-noise.jpg",
  },
  "coastline-milky-way": {
    title: "Coastline Milky Way",
    src: "/images/astro/coastline-milky-way.jpg",
  },
  "comet-tree": {
    title: "Comet Tree",
    src: "/images/after-dark/DFB08D78-D13D-40B9-9154-898FBA4A7EEF.jpg",
    displayScale: 0.85,
  },
  "milky-way-over-the-village": {
    title: "Milky Way over the Village",
    src: "/images/astro/milky-way-over-the-village.jpg",
  },
  "window-under-the-stars": {
    title: "Window Under the Stars",
    src: "/images/astro/window-under-the-stars.jpg",
  },
  "tower-star-trails": {
    title: "Tower Star Trails",
    src: "/images/astro/tower-star-trails.jpg",
  },
  "star-trails": {
    title: "Star Trails",
    src: "/images/after-dark/startrails.jpg",
  },
  "shared-umbrella": {
    title: "Shared Umbrella",
    src: "/images/after-dark/shared-umbrella.jpg",
  },
  "between-the-doors": {
    title: "Between the Doors",
    src: "/images/street/between-the-doors.jpg",
  },
  "after-leopoldstadt": {
    title: "After Leopoldstadt",
    src: "/images/street/after-leopoldstadt.jpg",
  },
  "red-runner": {
    title: "Red Runner",
    src: "/images/street/red-runner.jpg",
  },
  "snow-walk": {
    title: "Snow Walk",
    src: "/images/street/snow-walk.jpg",
  },
  "walking-the-rain": {
    title: "Walking the Rain",
    src: "/images/street/walking-the-rain.jpg",
  },
  "the-courier-and-the-mannequin": {
    title: "The Courier and the Mannequin",
    src: "/images/street/the-courier-and-the-mannequin.jpg",
  },
  "white-socks": {
    title: "White Socks",
    src: "/images/street/white-socks.jpg",
  },
  "cyclist-and-shadow": {
    title: "Cyclist and Shadow",
    src: "/images/street/cyclist-and-shadow.jpg",
  },
  "union-jack-suit": {
    title: "Union Jack Suit",
    src: "/images/street/union-jack-suit.jpg",
    displayScale: 0.82,
  },
  "rain-edition": {
    title: "Rain Edition",
    src: "/images/street/rain-edition.jpg",
  },
  "bowler-hat": {
    title: "Bowler Hat",
    src: "/images/street/bowler-hat.jpg",
  },
  "under-the-arch": {
    title: "Under the Arch",
    src: "/images/street/under-the-arch.jpg",
  },
  "a-kiss-on-bond-street": {
    title: "A Kiss on Bond Street",
    src: "/images/street/a-kiss-on-bond-street.jpg",
  },
  "table-for-two": {
    title: "Table for Two",
    src: "/images/street/table-for-two.jpg",
  },
  "two-generations": {
    title: "Two Generations",
    src: "/images/street/two-generations.jpg",
  },
  "green-chef": {
    title: "Green chef",
    src: "/images/street/green-chef.jpg",
  },
  "five-ronalds": {
    title: "Five Ronalds",
    src: "/images/street/five-ronalds.jpg",
  },
  "toward-happiness": {
    title: "Toward Happiness",
    src: "/images/street/toward-happiness.jpg",
  },
  "whisper": {
    title: "Whisper",
    src: "/images/after-dark/piccadilly-crowd.jpg",
  },
  "remembrance": {
    title: "Remembrance",
    src: "/images/street/remembrance.jpg",
  },
  "the-cat-keeper": {
    title: "The Cat Keeper",
    src: "/images/street/the-cat-keeper.jpg",
  },
  "quiet-reader": {
    title: "Quiet Reader",
    src: "/images/street/quiet-reader.jpg",
  },
  "delivery-rider": {
    title: "Delivery Rider",
    src: "/images/street/delivery-rider.jpg",
  },
  "lantern-wall": {
    title: "Lantern Wall",
    src: "/images/street/lantern-wall.jpg",
  },
  "orange-passenger": {
    title: "Orange Passenger",
    src: "/images/street/orange-passenger.jpg",
  },
  "headless": {
    title: "Headless",
    src: "/images/street/headless.jpg",
  },
  "peaky-blinder": {
    title: "Peaky Blinder",
    src: "/images/street/peaky-blinder.jpg",
  },
  "the-orb": {
    title: "The Orb",
    src: "/images/street/the-orb.jpg",
  },
  "incognito": {
    title: "Incognito",
    src: "/images/street/incognito.jpg",
  },
  "brand-new-day": {
    title: "Brand New Day",
    src: "/images/street/brand-new-day.jpg",
  },
  "double-up": {
    title: "Double Up",
    src: "/images/street/double-up.jpg",
  },
  "mount-olympus": {
    title: "Mount Olympus",
    src: "/images/street/mount-olympus.jpg",
  },
  "in-front-of-the-sale": {
    title: "In Front of the Sale",
    src: "/images/street/in-front-of-the-sale.jpg",
  },
  "waiting-with-ronald": {
    title: "Waiting with Ronald",
    src: "/images/street/waiting-with-ronald.jpg",
  },
  "late-cafe": {
    title: "Late Cafe",
    src: "/images/after-dark/late-cafe.jpg",
  },
  "night-shift": {
    title: "Night Shift",
    src: "/images/street/night-shift.jpg",
  },
  "before-the-great-door": {
    title: "Before the Great Door",
    src: "/images/monochrome/before-the-great-door.jpg",
  },
  "white-church-black-sky": {
    title: "White Church, Black Sky",
    src: "/images/monochrome/white-church-black-sky.jpg",
  },
  "crossing-the-lines": {
    title: "Crossing the Lines",
    src: "/images/monochrome/crossing-the-lines.jpg",
  },
  "crossing-the-light": {
    title: "Crossing the Light",
    src: "/images/monochrome/crossing-the-light.jpg",
  },
  "white-corner": {
    title: "White Corner",
    src: "/images/monochrome/white-corner.jpg",
  },
  "first-table": {
    title: "First Table",
    src: "/images/monochrome/first-table.jpg",
  },
  "white-geometry": {
    title: "White Geometry",
    src: "/images/monochrome/white-geometry.jpg",
  },
  "into-the-light": {
    title: "Into the Light",
    src: "/images/monochrome/into-the-light.jpg",
  },
  "kuala-lumpur": {
    title: "Kuala Lumpur",
    src: "/images/monochrome/kuala-lumpur.jpg",
  },
  "black-edge": {
    title: "Black Edge",
    src: "/images/monochrome/black-edge.jpg",
  },
  "rue-drouin": {
    title: "Rue Drouin",
    src: "/images/monochrome/rue-drouin.jpg",
  },
  "eleven-windows": {
    title: "Eleven Windows",
    src: "/images/monochrome/eleven-windows.jpg",
  },
  "opposite-directions": {
    title: "Opposite Directions",
    src: "/images/monochrome/opposite-directions.jpg",
  },
  "incomplete": {
    title: "Incomplete",
    src: "/images/monochrome/incomplete.jpg",
  },
  "disc-facade": {
    title: "Disc Facade",
    src: "/images/monochrome/disc-facade.jpg",
  },
  "concrete-curve": {
    title: "Concrete Curve",
    src: "/images/monochrome/concrete-curve.jpg",
  },
  "four-shadows": {
    title: "Four Shadows",
    src: "/images/monochrome/four-shadows.jpg",
  },
  "cyclist-in-light": {
    title: "Cyclist in Light",
    src: "/images/monochrome/cyclist-in-light.jpg",
  },
  "harrow-483": {
    title: "Harrow 483",
    src: "/images/monochrome/harrow-483.jpg",
  },
  "stair-light": {
    title: "Stair Light",
    src: "/images/monochrome/stair-light.jpg",
  },
  "light-beams": {
    title: "Light Beams",
    src: "/images/monochrome/light-beams.jpg",
    displayScale: 0.96,
  },
  "one-poultry": {
    title: "One Poultry",
    src: "/images/monochrome/one-poultry.jpg",
  },
  "the-bright-end": {
    title: "The Bright End",
    src: "/images/monochrome/the-bright-end.jpg",
  },
  "passing-the-wedge": {
    title: "Passing the Wedge",
    src: "/images/monochrome/passing-the-wedge.jpg",
  },
  "two-selves": {
    title: "Two Selves",
    src: "/images/monochrome/two-selves.jpg",
  },
  "folded-passenger": {
    title: "Folded Passenger",
    src: "/images/monochrome/folded-passenger.jpg",
  },
  "contortionist": {
    title: "Contortionist",
    src: "/images/monochrome/contortionist.jpg",
    displayScale: 0.78,
  },
  "millipede-spiral": {
    title: "Millipede Spiral",
    src: "/images/monochrome/millipede-spiral.jpg",
    displayScale: 0.93,
  },
  "spiral-stairs": {
    title: "Spiral Stairs",
    src: "/images/monochrome/spiral-stairs.jpg",
  },
  "roof-rhythm": {
    title: "Roof Rhythm",
    src: "/images/monochrome/roof-rhythm.jpg",
  },
  "under-the-word": {
    title: "Under the Word",
    src: "/images/monochrome/under-the-word.jpg",
  },
  "vanishing-passage": {
    title: "Vanishing Passage",
    src: "/images/monochrome/vanishing-passage.jpg",
  },
  "blindfold-piano": {
    title: "Blindfold Piano",
    src: "/images/monochrome/blindfold-piano.jpg",
    displayScale: 0.87,
  },
  "reflected-reader": {
    title: "Reflected Reader",
    src: "/images/monochrome/reflected-reader.jpg",
  },
  "under-two-arches": {
    title: "Under Two Arches",
    src: "/images/monochrome/under-two-arches.jpg",
  },
  "cyberpunk": {
    title: "CyberPunk",
    src: "/images/after-dark/fog-walker.jpg",
  },
  "blue-oculus": {
    title: "Blue Oculus",
    src: "/images/after-dark/blue-oculus.jpg",
  },
  "night-shift-after-dark": {
    title: "Night Shift",
    src: "/images/after-dark/night-train.jpg",
  },
  "last-bus": {
    title: "Last Bus",
    src: "/images/after-dark/last-bus.jpg",
  },
  "around-the-corner": {
    title: "Around the corner",
    src: "/images/after-dark/orange-lamp-fog.jpg",
  },
  "red-light": {
    title: "Red light",
    src: "/images/after-dark/red-signal-fog.jpg",
  },
  "fog-street": {
    title: "Fog Street",
    src: "/images/after-dark/fog-street.jpg",
    displayScale: 0.81,
  },
  "blue-poncho": {
    title: "Blue Poncho",
    src: "/images/after-dark/blue-poncho.jpg",
  },
  "path-lights": {
    title: "Path Lights",
    src: "/images/after-dark/path-lights.jpg",
  },
  "tower-bridge-fog": {
    title: "Tower Bridge Fog",
    src: "/images/after-dark/tower-bridge-fog.jpg",
    displayScale: 0.8,
  },
  "rain-bus": {
    title: "Rain Bus",
    src: "/images/after-dark/rain-bus.jpg",
  },
  "noodle-alley": {
    title: "Noodle Alley",
    src: "/images/lo-noodle-alley.jpg",
    displayScale: 0.89,
  },
  "end-of-the-pier": {
    title: "End of the Pier",
    src: "/images/after-dark/end-of-the-pier.jpg",
  },
  "waiting-under-the-lamps": {
    title: "Waiting Under the Lamps",
    src: "/images/after-dark/waiting-under-the-lamps.jpg",
  },
  "threshold": {
    title: "Threshold",
    src: "/images/after-dark/threshold.jpg",
  },
  "suffocating": {
    title: "Suffocating",
    src: "/images/after-dark/suffocating.jpg",
  },
  "bond": {
    title: "Bond",
    src: "/images/after-dark/neon-coupe.jpg",
  },
  "pizza-flip": {
    title: "Pizza flip",
    src: "/images/after-dark/la-lasagne.jpg",
  },
  "fogbound-traffic": {
    title: "Fogbound Traffic",
    src: "/images/after-dark/fogbound-traffic.jpg",
  },
  "among-us": {
    title: "Among us",
    src: "/images/after-dark/snowflake-window.jpg",
    displayScale: 0.71,
  },
  "in-the-woods": {
    title: "In  the woods",
    src: "/images/after-dark/in-the-woods.jpg",
  },
  "blue": {
    title: "Blue",
    src: "/images/after-dark/blue.jpg",
  },
  "still": {
    title: "Still",
    src: "/images/after-dark/night-grocery.jpg",
  },
  "puddle-jump": {
    title: "Puddle jump",
    src: "/images/after-dark/piccadilly-run.jpg",
  },
  "before-the-fire": {
    title: "Before the Fire",
    src: "/images/after-dark/before-the-fire.jpg",
  },
  "into-the-fog": {
    title: "Into the Fog",
    src: "/images/after-dark/into-the-fog.jpg",
  },
  "soho-kitchen": {
    title: "Soho Kitchen",
    src: "/images/after-dark/soho-kitchen.jpg",
  },
  "rain-mosaic": {
    title: "Rain Mosaic",
    src: "/images/after-dark/rain-mosaic.jpg",
  },
  "blade-runner-ii": {
    title: "Blade Runner II",
    src: "/images/after-dark/blade-runner-ii.jpg",
  },
  "night-patrol": {
    title: "Night Patrol",
    src: "/images/after-dark/night-patrol.jpg",
  },
  "coastal-moon": {
    title: "Coastal Moon",
    src: "/images/nature/coastal-moon.jpg",
  },
  "hillside-lights": {
    title: "Hillside Lights",
    src: "/images/nature/hillside-lights.jpg",
    displayScale: 0.83,
  },
  "sunset-shore": {
    title: "Sunset Shore",
    src: "/images/travel/sunset-shore.jpg",
  },
  "star-road": {
    title: "Star Road",
    src: "/images/after-dark/650CD8F4-159E-4E17-BF66-985E8DD1F47E.jpg",
    displayScale: 0.78,
  },
  "steel-wool-stars": {
    title: "Steel Wool Stars",
    src: "/images/after-dark/FIRE50edit.jpg",
  },
  "sunburst-walk": {
    title: "Sunburst Walk",
    src: "/images/street/sunburst-walk.jpg",
  },
} as const satisfies Record<PhotoId, PhotoRecord>;

export type CatalogPhotoId = keyof typeof photos;
