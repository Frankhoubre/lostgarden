import Image from "next/image";
import { AuthForm } from "@/components/auth/AuthForm";

export function LoginGate() {
  return (
    <div className="relative min-h-screen overflow-hidden px-5 py-28">
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <Image
          src="/images/login-background.jpg"
          alt=""
          fill
          priority
          unoptimized
          className="login-scene-layer object-cover object-center"
          sizes="100vw"
        />
        <div className="login-scene-veil absolute inset-0" />
      </div>

      <div className="relative z-10 mx-auto max-w-lg text-center">
        <h1 className="font-display text-3xl tracking-[0.12em] text-lily drop-shadow-[0_2px_24px_rgba(2,8,23,0.9)]">
          Discover the experience
        </h1>
        <p className="mt-4 font-body text-sm leading-relaxed text-ivory/75 drop-shadow-[0_1px_16px_rgba(2,8,23,0.85)]">
          Sign in to enter the first chapter of the underground.
        </p>
        <div className="mt-10">
          <AuthForm redirectTo="/experience" />
        </div>
      </div>
    </div>
  );
}
