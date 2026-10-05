/* THE CSS TARGET IS A THEME DECISION. Every color token is
   light-dark(light, dark) (src/tokens/tokens.css), and a surface picks its
   scheme with color-scheme, which is how Relay in the preview frame stays
   light inside a dark review. For a browser that predates light-dark() the
   minifier rewrites each one as
   var(--lightningcss-light, a) var(--lightningcss-dark, b), and a custom
   property with a var() in it is resolved where it is declared, on the root,
   once. Every token then arrives at the frame already dark, and the frame's
   own color-scheme can no longer change it: the deployed product showed
   Relay dark, the dev server and the Storybook showed it light, and every
   test ran against one of those two. The default target (Chrome 107,
   Safari 16) is old enough to do it. light-dark() is native from Chrome 123,
   Edge 123, Firefox 120 and Safari 17.5, which is the oldest this app is
   drawn for.

   One list, read by vite.config.ts for the app and by .storybook/main.ts
   for the Storybook, whose Vite builder drops the project's `build` options
   and so needs it handed over again. scripts/build-check.mjs fails a build
   (and the deploy) if the rewrite comes back, whatever the cause: this list,
   a Vite upgrade or a new minifier default. */
export const CSS_TARGET = ['chrome123', 'edge123', 'firefox120', 'safari17.5'];
