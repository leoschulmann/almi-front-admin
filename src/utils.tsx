import { Skeleton } from "@/components/ui/skeleton.tsx";

export function renderSkeleton(count: number = 30) {
  return (
    <div>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          className={`h-5 flex ${
            index % 3 === 0 ? "w-1/2" : index % 3 === 1 ? "w-2/3" : "w-3/4"
          } mb-4`}
        />
      ))}
    </div>
  );
}
