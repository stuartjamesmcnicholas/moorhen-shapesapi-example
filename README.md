This project demonstrates uses the Moorhen web component. It depends on no build/package system - no need for Vite, webpack, etc.
It consists of a single `index.htmnl` which loads Moorhen with `<script type="importmap">`. 

An example of talking to Moorhen's API is shown in `main.js`. *This project uses an alpha version of Moorhen that offers 3D shapes and a 
consistent Vectors API. Buttons are available to load a sphere and a vector.*
```
npm install

cp -r node_modules/moorhen/public/MoorhenAssets public/
cp node_modules/moorhen/moorhen.js node_modules/moorhen/*.moorhen.js public/
cp node_modules/moorhen/MoorhenWebComponentUtils.js public/
cp node_modules/moorhen/moorhen.js.LICENSE.txt public/

cd public && python3 ../SimpleCrossOriginServer.py 8000
```
