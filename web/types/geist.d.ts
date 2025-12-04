// web/types/geist.d.ts
import { NextFontWithVariable } from "next/dist/compiled/@next/font";

declare module "geist/font/sans" {
  export const GeistSans: NextFontWithVariable;
}

declare module "geist/font/mono" {
  export const GeistMono: NextFontWithVariable;
}
