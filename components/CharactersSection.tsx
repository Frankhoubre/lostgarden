import { AnimatedInView } from "./AnimatedInView";
import { AtmosphereLayer } from "./AtmosphereLayer";
import { CharacterCard } from "./CharacterCard";
import { SectionTitle } from "./SectionTitle";

const characters = [
  {
    name: "Sol",
    type: "Hollow Armor",
    tagline:
      "An empty knight with a lantern-shaped head, no body, no voice, and a duty he does not understand.",
    description:
      "Sol is not a legendary warrior. He is damaged, awkward, and strangely innocent, an old armor awakened in the depths of a blue cavern. He cannot truly speak. Only hollow metallic sounds, creaks, groans, and quiet gestures reveal what he feels. Yet when danger comes, he places himself between Rose and the world.",
    traits: ["Empty armor", "Lantern helmet", "Protective instinct", "Clumsy but brave"],
    visual: "sol" as const,
  },
  {
    name: "Rose",
    type: "Mysterious Child",
    tagline:
      "A quiet child whose presence makes life return where nothing should grow.",
    description:
      "Rose is small, calm, and almost unreal. She walks through ruined places with a strange serenity, as if she can hear what the world has forgotten. Around her, flowers bloom, roots move, and the dead earth sometimes remembers how to breathe. But Rose is not a weapon, not a miracle to spend, and not a symbol. She is a child.",
    traits: ["Silent strength", "White lilies", "Hidden power", "Gentle presence"],
    visual: "rose" as const,
  },
  {
    name: "The Sleeping Machines",
    type: "Ancient Alien Relics",
    tagline:
      "Colossal mechanical-organic beings, half dead, half dreaming beneath moss and roots.",
    description:
      "Long after the old catastrophe, the machines still lie buried in the blue forests. Their bodies are rusted, cracked, and covered in fungi, but some eyes still open in the dark. They do not hate. They do not forgive. They awaken like forgotten disasters.",
    traits: ["Giant eye", "Mechanical limbs", "Moss-covered metal", "Dormant threat"],
    visual: "machines" as const,
  },
  {
    name: "The Masked Pilgrims",
    type: "Unknown Procession",
    tagline:
      "Figures in black hoods and white masks, carrying strange rituals through the mist.",
    description:
      "Seen only from afar, they move through the cavern platforms in silent processions. Their gongs echo across the abyss. Nobody knows if they are guardians, mourners, or something older. Their presence means the depths are not empty.",
    traits: ["White masks", "Black hoods", "Ritual gongs", "Silent procession"],
    visual: "pilgrims" as const,
  },
];

export function CharactersSection() {
  return (
    <section id="characters" className="section-pad section-abyss scroll-mt-14">
      <AtmosphereLayer />
      <AnimatedInView>
        <SectionTitle subtitle="In the caverns beneath the world, even broken things remember how to protect.">
          Characters
        </SectionTitle>
      </AnimatedInView>

      <div className="mx-auto mt-16 grid max-w-6xl gap-6 md:grid-cols-2">
        {characters.map((character, index) => (
          <AnimatedInView key={character.name} delay={0.1 + index * 0.08}>
            <CharacterCard {...character} />
          </AnimatedInView>
        ))}
      </div>
    </section>
  );
}
