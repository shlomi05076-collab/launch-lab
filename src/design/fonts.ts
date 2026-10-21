import { Archivo, JetBrains_Mono, Public_Sans } from "next/font/google";

/*
 * Type system (M0 design gate): Archivo semi-expanded for headings, Public Sans for body,
 * JetBrains Mono for every figure. Each font sets a --ff-* variable read by globals.css.
 */

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--ff-display" });
const publicSans = Public_Sans({ subsets: ["latin"], variable: "--ff-body" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--ff-mono" });

export const fontVariables = `${archivo.variable} ${publicSans.variable} ${jetbrainsMono.variable}`;

export const fontNames = {
  display: "Archivo, semi-expanded (112.5%)",
  body: "Public Sans",
  mono: "JetBrains Mono, tabular figures",
} as const;
