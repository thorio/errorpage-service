# Superseded by https://github.com/thorio/website

# errorpage-service

Service that delivers HTML errorpages, intended for use with [Traefik](https://github.com/traefik/traefik).

## Quick Start

To enable global 404 pages for traefik, add this to your compose file:

```yaml
services:
  errorpages:
    image: thoriogit/errorpage-service
    restart: unless-stopped
    labels:
      traefik.enable: true
      traefik.http.routers.errorpages.rule: HostRegexp(`{host:.+}`)
      traefik.http.routers.errorpages.entrypoints: https
      traefik.http.services.errorpages.loadbalancer.server.port: 80
```

Traefik will now automatically fall back on this service, which returns the 404 page.

You can also define a middleware to handle errors for other services:

```yaml
labels:
  traefik.http.middlewares.my-errors.errors.status: 500-599 # specify which status codes you want to handle
  traefik.http.middlewares.my-errors.errors.query: /_error/{status}
  traefik.http.middlewares.my-errors.errors.service: errorpages@docker
```

Now simply add the middleware to your router like so:

```yaml
labels:
  traefik.http.routers.my-app.middlewares: my-errors
```

## Custom errors

You can easily add your own pages by mounting them inside the container at `/data/custom/{status}.html`.
The "error not found" page can also be customized, by placing `meta404.html` in the same directory.

Remember that errors must be single html files.
