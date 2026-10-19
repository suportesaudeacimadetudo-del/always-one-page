import { ImageIcon } from "lucide-react";
export function ExerciseIllustration({
  image,
  alt = "Ilustração do exercício",
  className = "",
}: {
  image?: string | undefined;
  alt?: string;
  className?: string;
}) {
  return image ? (
    <img
      src={image}
      alt={alt}
      loading="lazy"
      decoding="async"
      width="640"
      height="640"
      className={`bg-mint object-contain ${className}`}
    />
  ) : (
    <div
      className={`flex flex-col items-center justify-center gap-2 bg-mint text-slate-500 ${className}`}
    >
      <ImageIcon aria-hidden="true" className="size-8" />
      <span className="text-xs">Sem imagem</span>
    </div>
  );
}
