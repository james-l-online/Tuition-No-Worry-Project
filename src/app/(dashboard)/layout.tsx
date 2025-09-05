import Menu from "@/components/Menu"; 
import Image from "next/image";
import Navbar from "@/components/Navbar";
import React from "react";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen flex">
      {/* LEFT */}
      <div className='w-[14%] md:w[8%] lg:w-[16%] xl:w-[14%] bg-white p-4'>
        <link 
          href="/" 
          className="flex items-center justify-center lg:justify-start gap-2"/>
          <Image src="/logo.png" alt="logo" width={32} height={32}/>
          <span className="hidden lg:block">Tuition No Worry</span>
        <link/>
        <Menu/>
      </div>  
      {/* RIGHT */}
      <div className='w-[86%] md:[92%] lg:w-[84%] xl:w-[86%] bg-[#c5d0e8] overflow-scroll'>
        <Navbar/>
        <div>{children}</div>       
      </div>
    </div>
  );
}
