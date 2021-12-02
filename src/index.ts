import { handleRequest } from './handler';
import {substrBetween} from './substrBetween';

async function preHandleRequest(event: FetchEvent): Promise<Response>{
  const request = event.request;
  const url = request.url;
  const ts = substrBetween(url, 'ts=', '&');
  let cacheKey: Request | undefined;
  const cache = caches.default;
  if(ts){
    const cacheURL = new URL(url);
    cacheKey = new Request(cacheURL.toString(), request);
    const cachedResponse = await cache.match(cacheKey);
    if(cachedResponse){
      return cachedResponse;
    }
  }
  const response = await handleRequest(request);
  if(cacheKey !== undefined){
    response.headers.append("Cache-Control", "s-maxage=10000000")
    event.waitUntil(cache.put(cacheKey, response.clone()));
  }
  //event.respondWith(response);
  return response;
};

addEventListener("fetch", event => {
  try {
    const request = event.request
    return event.respondWith(preHandleRequest(event))
  } catch (e: any) {
    return event.respondWith(new Response("Error thrown " + e.message))
  }
})
