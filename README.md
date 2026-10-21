# Senpai — The Endless Chase (Three.js 3D project)

This is a new Three.js-based 3D browser-game foundation. It is not the earlier 2D canvas prototype.

## Run locally
1. Install Node.js LTS.
2. Extract this ZIP.
3. Open a terminal in the project folder.
4. Run `npm install`
5. Run `npm run dev`
6. Open the local URL printed by Vite.

## Production
- `npm run build`
- `npm run preview`

## Deploy to Vercel
Import the project repository in Vercel. Framework preset: Vite. Build command: `npm run build`. Output directory: `dist`.

## Controls
- Mobile: swipe left/right to change lanes, swipe up to jump, swipe down to slide. On-screen buttons are also included.
- PC: arrows or WASD; Space/Up to jump; Down to slide; Escape to pause.

## Implemented foundation
- Three.js WebGL 3D scene with perspective camera, lighting, fog, shadows, scenery, pagodas, trees and four environment palettes.
- Three-lane movement, jump/slide states, track, obstacles, coins, chase meter, menus, dialogue text, and restart/pause flow.
- Responsive interface and keyboard/touch controls.

## Honest limitations
- Character meshes in this starter are procedural stylized 3D placeholders, not final anime-quality rigged models matching the supplied references. Replace them with properly licensed `.glb` characters and animations for the intended visual quality.
- Dialogue currently uses synthesized UI tones and text; recorded voice acting is not bundled.
- The world art is procedurally assembled from Three.js meshes, not a high-end hand-authored environment pack.
- This is a foundation/prototype, not a finished commercial-quality Temple Run equivalent. Test and tune collisions and device performance before publishing.

## Dependencies
Three.js and Vite are installed through npm. A network connection is required for `npm install`.