import Image from "next/image";

type LoginSceneBackgroundProps = {
  /** Pin to viewport (experience page) vs. section bounds (home discover block). */
  fixed?: boolean;
};

export function LoginSceneBackground({ fixed = false }: LoginSceneBackgroundProps) {
  return (
    <div
      className={`login-scene pointer-events-none ${fixed ? "fixed" : "absolute"} inset-0`}
      aria-hidden="true"
    >
      <Image
        src="/images/login-background.jpg"
        alt=""
        fill
        priority={fixed}
        unoptimized
        className="login-scene-layer object-cover object-center"
        sizes="100vw"
      />
      <div className="login-scene-veil absolute inset-0" />
    </div>
  );
}
