import { ExternalLink } from "@/components/ui/ExternalLink";
import { PlaceholderPill } from "@/components/ui/Placeholder";
import { release } from "@/config/release";
import { siteConfig } from "@/config/site";

import { Section } from "./Section";

/** Réseaux officiels de JONAA. */
export function FollowSection() {
  const { socialLinks } = release;

  return (
    <Section
      id="suivre"
      number="04"
      eyebrow="Suivre"
      title={`Suivre ${siteConfig.artist}`}
      layout="center"
    >
      {socialLinks.length > 0 ? (
        <ul className="flex flex-wrap justify-center gap-3">
          {socialLinks.map((social) => (
            <li key={social.url}>
              <ExternalLink
                href={social.url}
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-star/30 px-6 text-xs tracking-[0.18em] uppercase transition-colors hover:border-glow hover:text-glow"
              >
                {social.network}
              </ExternalLink>
            </li>
          ))}
        </ul>
      ) : (
        <PlaceholderPill label="réseaux officiels" className="px-6 py-4" />
      )}
    </Section>
  );
}
