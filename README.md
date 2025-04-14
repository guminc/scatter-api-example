This is a minimal [Next.js](https://nextjs.org) project intended to serve as an example of how to build your own custom minting pages for Scatter collections by utilizing our public API. We used Next.js for the example because we like it, but you can integrate the Scatter API with anything that is capable of sending web requests.

All of the relevant code for learning the Scatter API is in `src/app/page.tsx`.

You can view a live deployment of this example at [https://scatter-api-example.guminc.dev](https://scatter-api-example.guminc.dev/).

## Getting Started

1. Install

```bash
npm i
```

2. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Libraries

This example uses [wagmi](https://wagmi.sh/) for web3 interactions and [TanStack Query](https://tanstack.com/query/latest) for data fetching and asynchronous state management. If you're building a React app and unsure, we highly recommend using these libraries too. But as stated above, you can make this work with whatever tech you want, it's just a REST API.

Other libraries used in this example are [shadcn-ui](https://ui.shadcn.com/) for UI components and [AppKit](https://reown.com/appkit) for handling wallet connections.
