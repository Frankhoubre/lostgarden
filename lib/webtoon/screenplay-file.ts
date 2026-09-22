"use client";

/**
 * A screenplay file as plain text, in the browser: plain text and Fountain
 * as they are, Final Draft (.fdx, XML) paragraph by paragraph with its
 * element type (scene heading, character, dialogue) kept as a screenplay
 * page would show it. PDF is not read here: its text is pasted instead.
 */
export async function readScreenplayFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) throw new Error("Un PDF ne se lit pas ici : copiez son texte et collez-le.");
  const text = await file.text();
  if (!name.endsWith(".fdx")) return text.replace(/\r\n?/g, "\n");
  const xml = new DOMParser().parseFromString(text, "application/xml");
  if (xml.querySelector("parsererror")) throw new Error("Fichier Final Draft illisible");
  const lines: string[] = [];
  for (const paragraph of Array.from(xml.querySelectorAll("Content > Paragraph"))) {
    const type = paragraph.getAttribute("Type") ?? "";
    const content = Array.from(paragraph.querySelectorAll("Text"))
      .map((node) => node.textContent ?? "")
      .join("")
      .trim();
    if (!content) continue;
    if (type === "Scene Heading") lines.push("", content.toUpperCase());
    else if (type === "Character") lines.push("", `    ${content.toUpperCase()}`);
    else if (type === "Dialogue" || type === "Parenthetical") lines.push(`    ${content}`);
    else if (type === "Transition") lines.push("", content.toUpperCase());
    else lines.push(content);
  }
  return lines.join("\n").trim();
}
