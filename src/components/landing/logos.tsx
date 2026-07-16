// Brand logos rendered from uploaded SVG assets.
import joobleUrl from "@/assets/logos/jooble.svg?url";
import greenhouseUrl from "@/assets/logos/greenhouse.svg?url";
import leverUrl from "@/assets/logos/lever.svg?url";
import ashbyUrl from "@/assets/logos/ashby.svg?url";
import usajobsUrl from "@/assets/logos/usajobs.svg?url";

type LogoProps = { className?: string };

export function JoobleLogo({ className }: LogoProps) {
  return <img src={joobleUrl} alt="Jooble" className={className} style={{ height: 34 }} />;
}

export function GreenhouseLogo({ className }: LogoProps) {
  return <img src={greenhouseUrl} alt="Greenhouse" className={className} style={{ height: 34 }} />;
}

export function LeverLogo({ className }: LogoProps) {
  return <img src={leverUrl} alt="Lever" className={className} style={{ height: 34 }} />;
}

export function AshbyLogo({ className }: LogoProps) {
  return <img src={ashbyUrl} alt="Ashby" className={className} style={{ height: 34 }} />;
}

export function UsaJobsLogo({ className }: LogoProps) {
  return <img src={usajobsUrl} alt="USAJOBS" className={className} style={{ height: 29 }} />;
}