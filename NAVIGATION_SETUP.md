# QR AR indoor navigation

The museum site is a buildless HTML/CSS/JavaScript app served by `server.mjs`. The navigation feature uses:

- `navigation-config.js` for editable waypoint and walking-edge data.
- `app.js` for camera permission, QR decoding, A* route calculation, live-camera overlay, checkpoint updates, and arrival state.
- `admin.html` for local curator configuration and printable QR markers.

## Run locally

From the `ar-museum` folder:

```powershell
node server.mjs
```

Open `http://localhost:4173/index.html` on the development computer. A phone cannot normally access the computer's `localhost`; for phone testing serve the folder from an HTTPS host or a trusted HTTPS tunnel and use that HTTPS URL on the phone. Camera access requires HTTPS (or localhost).

## Test without a phone

1. Open **AR Navigation**.
2. Choose **Exhibit Area A**.
3. Open **Start live camera direction**.
4. In the browser console, run `handleScanValue('OMHM:LOC:reception')` to simulate a checkpoint.
5. Run `handleScanValue('OMHM:LOC:area-a')` to confirm arrival.

The app does not advance the route using a timer. Progress changes only after a validated checkpoint QR is detected.

## QR values

Use the exact values shown in the admin workspace, for example:

```text
OMHM:LOC:entrance
OMHM:LOC:reception
OMHM:LOC:artifact-gallery
OMHM:LOC:exit
```

The legacy entrance value `MANGYANG:NAV:ENTRANCE` is also accepted and maps to `entrance`.

## Replace the sample map

The checked-in map is intentionally labeled as a sample. Measure the real museum and update waypoint `x`/`y` positions, floor numbers, QR IDs, and edge distances. Add one QR checkpoint at every safe stopping point where a visitor can rescan. Use the admin workspace to edit coordinates, add waypoints, connect paths, block paths, and generate markers. Saving stores the configuration in `localStorage` for that browser; move the resulting JSON into `navigation-config.js` or a backend before deployment.

The camera layer is real and uses `getUserMedia`. On browsers without reliable world-anchored WebXR, the app deliberately uses checkpoint-based navigation: arrows indicate the next route segment, and the position is recalibrated only after another QR scan. Device orientation permission is requested when available as a heading aid, but it is not presented as continuous indoor positioning.

For production, add authentication and persist the navigation configuration and uploaded assets in server storage rather than browser local storage.
