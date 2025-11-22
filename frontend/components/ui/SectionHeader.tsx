import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  title: string
  subtitle: string
  logoSource?: string | { src: string; alt?: string }
  className?: string
}

export function SectionHeader({
  title,
  subtitle,
  logoSource,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("w-full flex flex-col items-center mb-4", className)}>
      <div className="flex flex-col items-center gap-2">
        {logoSource && (
          <div className="mb-2">
            {typeof logoSource === "string" ? (
              <Image
                src={logoSource}
                alt="Logo"
                width={80}
                height={80}
                className="object-contain"
              />
            ) : (
              <Image
                src={logoSource.src}
                alt={logoSource.alt || "Logo"}
                width={80}
                height={80}
                className="object-contain"
              />
            )}
          </div>
        )}
        <div className="text-center space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-midnight-navy">
            {title}
          </h1>
          <p className="text-base text-midnight-navy/70 max-w-[280px] mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  )
}

