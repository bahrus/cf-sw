# cf-sw

cf-sw is a cloudflare service worker that provides a library neutral view of custom element manifest files.

## [Usage](https://cf-sw.bahrus.workers.dev/)

Demos:

[Shoelace](https://cf-sw.bahrus.workers.dev/?href=https%3A%2F%2Fcdn.skypack.dev%2F%40shoelace-style%2Fshoelace%2Fdist%2Fcustom-elements.json&stylesheet=https%3A%2F%2Funpkg.com%2Fwc-info%2Fsimple-ce-style.css&embedded=false&tags=&ts=2021-12-03T19%3A45%3A14.527Z&tocXSLT=https%3A%2F%2Funpkg.com%2Fwc-info%2Ftoc.xsl)

[Generic Components](https://cf-sw.bahrus.workers.dev/?href=https%3A%2F%2Funpkg.com%2F%40generic-components%2Fcomponents%2Fcustom-elements.json&stylesheet=https%3A%2F%2Funpkg.com%2Fwc-info%2Fsimple-ce-style.css&embedded=false&tags=&ts=2021-12-03T19%3A45%3A14.528Z&tocXSLT=https%3A%2F%2Funpkg.com%2Fwc-info%2Ftoc.xsl)

## TODO's

1.  Streaming



## Developing / Publishing

1. Install node.
2. Run command [npm install -g wrangler-cli](https://developers.cloudflare.com/workers/cli-wrangler/install-update)
3. Run command wrangler dev
4. To publish, run command wrangler publish
