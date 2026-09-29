/** The "STATE TO KEEP EXACTLY" line of a panel description (helmet on or off, what the hands hold), empty when there is none. */
export function stateOf(description: string): string {
  return /STATE TO KEEP EXACTLY:([^]*?)(?=MOTION:|EFFECTS|SCALE:|$)/.exec(description)?.[1]?.trim() ?? "";
}
