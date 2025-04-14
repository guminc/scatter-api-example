"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppKit } from "@reown/appkit/react";
import { useQuery } from "@tanstack/react-query";
import { useAccount, useReadContract } from "wagmi";

const SCATTER_API_URL = "https://api.scatter.art/v1";

// you likely want to change this to your own collection's slug
const COLLECTION_SLUG = "tribe-of-girl";

export default function Home() {
  const { address, isConnected } = useAccount();

  const { data: collection, isPending: isCollectionPending } = useQuery({
    queryKey: ["collection", COLLECTION_SLUG],
    queryFn: async () => {
      const response = await fetch(
        `${SCATTER_API_URL}/collection/${COLLECTION_SLUG}`
      );
      // abi comes back as a string, parsing it here to use with wagmi
      const data = await response.json();
      return { ...data, abi: JSON.parse(data.abi) };
    },
  });

  const { data: inviteLists, isPending: isInviteListsPending } = useQuery({
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

  const isPending = isCollectionPending || isInviteListsPending;

  return (
    <div className="flex flex-col items-center justify-items-center min-h-screen p-8 pb-20 gap-4 sm:p-12 font-[family-name:var(--font-geist-sans)]">
      <WalletConnect />
      <main className="flex w-xl flex-col gap-4 p-4">
        {!isPending &&
          inviteLists?.map((list: any) => (
            <InviteList key={list.id} list={list} collection={collection} />
          ))}
        {isPending && <p className="text-center">LOADING...</p>}
      </main>
    </div>
  );
}

function InviteList({
  list,
  collection,
}: {
  list: {
    // id: string;
    name: string;
    root: string;
    // currency_address: string;
    currency_symbol: string;
    token_price: string;
    wallet_limit: number;
    list_limit: number;
  };
  collection: {
    chain_id: number;
    address: string;
    abi: any;
    max_items: number;
    num_items: number;
  };
}) {
  const { address, isConnected } = useAccount();

  // technically the max limit on our contract is 4294967295, we treat this as unlimited
  const MAX_LIMIT = 4294967295;
  const hasWalletLimit = list.wallet_limit !== MAX_LIMIT;
  const hasListLimit = list.list_limit !== MAX_LIMIT;

  const price =
    list.token_price === "0"
      ? "FREE"
      : `${list.token_price} ${list.currency_symbol}`;

  const { data: listMinted } = useReadContract({
    abi: collection.abi,
    address: collection.address as `0x${string}`,
    functionName: "listSupply",
    chainId: collection.chain_id,
    args: [list.root],
  }) as { data: number };

  const { data: walletMinted } = useReadContract({
    abi: collection.abi,
    address: collection.address as `0x${string}`,
    functionName: "minted",
    chainId: collection.chain_id,
    args: [address as `0x${string}`, list.root],
    query: {
      enabled: isConnected,
    },
  }) as { data: number };

  const isListMintedOut =
    listMinted >= list.list_limit ||
    walletMinted >= list.wallet_limit ||
    collection.num_items >= collection.max_items; // if max supply is reached no lists will work

  return (
    <Card className={isListMintedOut ? "opacity-50 cursor-not-allowed" : ""}>
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
                  <p>
                    {walletMinted ?? "?"}/{list.wallet_limit}
                  </p>
                </div>
              )}
              {hasListLimit && (
                <div className="h-full flex items-center flex-col gap-1">
                  <p className="text-xs opacity-50">LIMIT</p>

                  <p>
                    {listMinted}/{list.list_limit}
                  </p>
                </div>
              )}
            </div>
            <Button
              className="h-full"
              disabled={!isConnected || isListMintedOut}
            >
              MINT
            </Button>
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
