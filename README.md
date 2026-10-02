This project demonstrates uses the Moorhen web component. It depends on no build/package system - no need for Vite, webpack, etc.
It consists of a single `index.htmnl` which loads Moorhen with `<script type="importmap">`. 

An example of talking to Moorhen's API is shown in `main.js`. *This project uses an alpha version of Moorhen that offers 3D shapes and a 
consistent Vectors API. Buttons are available to load a sphere and a vector.*
```
mkdir moorhen_example
cd moorhen example

npm install

cp -r node_modules/moorhen/public/MoorhenAssets public/
cp node_modules/moorhen/moorhen.js node_modules/moorhen/*.moorhen.js public/
cp node_modules/moorhen/MoorhenWebComponentUtils.js public/
cp node_modules/moorhen/moorhen.js.LICENSE.txt public/

cd public && python3 ../SimpleCrossOriginServer.py 8000
```
The last step is just an example and can be replaced by serving the `public` direcory however you wish.
However, note the required cross-origin headers:
```
from http.server import HTTPServer, SimpleHTTPRequestHandler, test
import sys

class CORSRequestHandler (SimpleHTTPRequestHandler):
    def end_headers (self):
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        SimpleHTTPRequestHandler.end_headers(self)

if __name__ == '__main__':
    test(CORSRequestHandler, HTTPServer, port=int(sys.argv[1]) if len(sys.argv) > 1 else 8000)
```

In express, you might have something like:
```
          exp.use(function(req, res, next) {
              res.header("Cross-Origin-Opener-Policy", "same-origin");
              res.header("Cross-Origin-Embedder-Policy", "require-corp");
              next();
          });
```
and something like this in an Apache `.htaccess` file (or better in apache config files):
```
<IfModule mod_headers.c>
    Header add Cross-Origin-Opener-Policy "same-origin"
    Header add Cross-Origin-Embedder-Policy "require-corp"
</IfModule>
```
