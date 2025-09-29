import Image from "next/image";
import CountChart from "./CountChart";
import prisma from "@/lib/prisma";

const CountChartContainer = async () => {
  const data = await prisma.student.groupBy({
    by: ["sex"],
    _count: true,
  });

  // Prisma's groupBy _count can have different shapes depending on client version
  // Normalize to numeric counts safely.
  const maleGroup = data.find((d) => d.sex === "MALE");
  const femaleGroup = data.find((d) => d.sex === "FEMALE");

  const extractCount = (grp: any) => {
    if (!grp || !grp._count) return 0;
    // Common shapes: { _count: { _all: number } } or { _count: number }
    if (typeof grp._count === "number") return grp._count;
    if (typeof grp._count._all === "number") return grp._count._all;
    // fallback: try to find a numeric property inside _count
    const keys = Object.keys(grp._count);
    for (const k of keys) {
      const v = (grp._count as any)[k];
      if (typeof v === "number") return v;
    }
    return 0;
  };

  const boys = extractCount(maleGroup);
  const girls = extractCount(femaleGroup);

  return (
    <div className="bg-white rounded-xl w-full h-full p-4">
      {/* TITLE */}
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Students</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      {/* CHART */}
      <CountChart boys={boys} girls={girls} />
      {/* BOTTOM */}
      <div className="flex justify-center gap-16">
        <div className="flex flex-col gap-1">
          <div className="w-5 h-5 bg-lamaSky rounded-full" />
          <h1 className="font-bold">{boys}</h1>
          <h2 className="text-xs text-gray-300">
            Boys ({(boys + girls) > 0 ? Math.round((boys / (boys + girls)) * 100) : 0}%)
          </h2>
        </div>
        <div className="flex flex-col gap-1">
          <div className="w-5 h-5 bg-lamaYellow rounded-full" />
          <h1 className="font-bold">{girls}</h1>
          <h2 className="text-xs text-gray-300">
            Girls ({(boys + girls) > 0 ? Math.round((girls / (boys + girls)) * 100) : 0}%)
          </h2>
        </div>
      </div>
    </div>
  );
};

export default CountChartContainer;
