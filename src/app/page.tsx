"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppKit } from "@reown/appkit/react";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";

const SCATTER_API_URL = "https://api.scatter.art/v1";

// you likely want to change this to your own collection's slug
const COLLECTION_SLUG = "tribe-of-girl";

export default function Home() {
  const { address, isConnected } = useAccount();

  const { data: inviteLists, isPending } = useQuery({
    queryKey: ["eligibleInviteLists", COLLECTION_SLUG, address],
    queryFn: async () => {
      const response = await fetch(
        `${SCATTER_API_URL}/collection/${COLLECTION_SLUG}/eligible-invite-lists${
          isConnected ? `?minterAddress=${address}` : ""
        }`
      );
      return response.json();
    },
  });

  return (
    <div className="flex flex-col items-center justify-items-center min-h-screen p-8 pb-20 gap-4 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <WalletConnect />
      <main className="flex w-xl flex-col gap-4 p-4">
        {inviteLists?.map((list: any) => (
          <InviteList key={list.id} list={list} />
        ))}
        {isPending && <p className="text-center">LOADING...</p>}
      </main>
    </div>
  );
}

function InviteList({
  list,
}: {
  list: {
    id: string;
    name: string;
    currency_address: string;
    currency_symbol: string;
    token_price: string;
    wallet_limit: number;
    list_limit: number;
  };
}) {
  // technically the max limit on our contract is 4294967295, we treat this as unlimited
  const MAX_LIMIT = 4294967295;
  const hasWalletLimit = list.wallet_limit !== MAX_LIMIT;
  const hasListLimit = list.list_limit !== MAX_LIMIT;

  const price =
    list.token_price === "0"
      ? "FREE"
      : `${list.token_price} ${list.currency_symbol}`;

  return (
    <Card>
      <CardContent>
        <div className="flex flex-row justify-between">
          <div className="flex flex-col max-w-64">
            <h2 className="font-bold">{list.name}</h2>
            <p className="text-sm text-gray-500">{price}</p>
          </div>
          <div className="flex flex-row gap-4">
            <div className="flex flex-row gap-2 items-center">
              {hasWalletLimit && (
                <div className="h-full flex items-center flex-col gap-1">
                  <p className="text-xs opacity-50">WAL. LIMIT</p>
                  <p>0/{list.wallet_limit}</p>
                </div>
              )}
              {hasListLimit && (
                <div className="h-full flex items-center flex-col gap-1">
                  <p className="text-xs opacity-50">LIMIT</p>

                  <p>0/{list.list_limit}</p>
                </div>
              )}
            </div>
            <Button className="h-full">MINT</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WalletConnect() {
  const { open } = useAppKit();
  const { isConnected } = useAccount();

  return (
    <>
      {!isConnected && (
        <Button className="cursor-pointer" onClick={() => open()}>
          CONNECT
        </Button>
      )}
      {isConnected && <appkit-account-button />}
    </>
  );
}
