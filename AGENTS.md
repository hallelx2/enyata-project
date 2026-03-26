<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Specific App Router Breaking Changes Discovered:
- **Instant Navigations**: If fixing slow client-side navigations, Suspense alone is not enough. You must also export `unstable_instant = { prefetch: 'static' }` from the route to ensure instant client-side navigations.
- **Cache Components**: Data fetching no longer uses old conventions. In `next.config.ts`, `cacheComponents: true` should be enabled. Data-level caching or UI-level caching is accomplished using the `'use cache'` directive alongside `cacheLife(duration)`.
- **Runtime APIs**: Components accessing runtime data (like cookies, headers, searchParams) must either be suspended or use specific conventions. If a component uses runtime data and you rely on Cache Components, do not use `'use cache'` on that component.
- **Loading State Precedence**: `<Suspense>` boundaries are strictly needed for uncached operations. A global `loading.tsx` only acts as a Suspense boundary wrapping `page.tsx`. For `<Suspense>` to work optimally with cache components, push dynamic access as far down the tree as possible.
<!-- END:nextjs-agent-rules -->
