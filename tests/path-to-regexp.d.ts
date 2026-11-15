// Types minimaux du path-to-regexp embarqué par Next.js (sans .d.ts publié).
// Utilisé par tests/retiredRoutes.test.ts pour compiler les redirections
// exactement comme le fait le build Next.js.
declare module "next/dist/compiled/path-to-regexp" {
  export function pathToRegexp(
    path: string,
    keys?: unknown[],
    options?: { strict?: boolean; sensitive?: boolean; delimiter?: string },
  ): RegExp;
}
