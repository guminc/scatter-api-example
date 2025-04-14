"use client";

import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { address, isConnected } = useAccount();

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <WalletConnect />
      </main>
    </div>
  );
}

function WalletConnect() {
  const { isConnected } = useAccount();

  return (
    <>
      {!isConnected && <Button>Connect</Button>}
      {isConnected && <p>connected</p>}
    </>
  );
}
