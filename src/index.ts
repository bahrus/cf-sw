import { handleRequest } from './handler';
import {substrBetween} from './substrBetween';

async function preHandleRequest(event: FetchEvent): Promise<Response>{
  const request = event.request;
  const url = request.url;
  const ts = substrBetween(url, 'ts=', '&');
  let cacheKey: Request | undefined;
  const cache = caches.default;
  console.log('start');
  if(ts){
    console.log('cacheable');
    const cacheURL = new URL(url);
    cacheKey = new Request(cacheURL.toString(), request);
    
    const cachedResponse = await cache.match(cacheKey);
    if(cachedResponse){
      console.log('return cached response');
      return cachedResponse;
    }
  }
  console.log('handleRequest');
  const response = await handleRequest(request);
  if(cacheKey !== undefined){
    console.log('cache response');
    event.waitUntil(cache.put(cacheKey, response.clone()));
  }
  console.log('return response');
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
