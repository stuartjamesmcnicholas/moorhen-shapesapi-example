```
npm install

cp node_modules/moorhen/moorhen.js node_modules/moorhen/*.moorhen.js public/
cp node_modules/moorhen/MoorhenWebComponentUtils.js public/
cp node_modules/moorhen/moorhen.js.LICENSE.txt public/

cd public && python3 ../SimpleCrossOriginServer.py 8000
```
