"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { config } from "@/config";
import { useAppKit } from "@reown/appkit/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { erc20Abi, maxUint256 } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { readContract, sendTransaction, writeContract } from "wagmi/actions";

const SCATTER_API_URL = "https://api.scatter.art/v1";

// You likely want to change this to your own collection's slug
const COLLECTION_SLUG = "tribe-of-girl";

export default function Home() {
  const { address, isConnected } = useAccount();

  // Fetching collection data from Scatter API
  const { data: collection, isPending: isCollectionPending } = useQuery({
    queryKey: ["collection", COLLECTION_SLUG],
    queryFn: async () => {
      const response = await fetch(
        `${SCATTER_API_URL}/collection/${COLLECTION_SLUG}`
      );
      // ABI comes back as a string, parsing it here to use with wagmi
      const data = await response.json();
      return { ...data, abi: JSON.parse(data.abi) };
    },
  });

  // Fetching eligible invite lists from Scatter API
  // if no minterAddress is provided, this will return public lists only
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
      <main className="flex w-xl flex-col gap-8 p-4">
        <div className="flex flex-col gap-2">
          {!isCollectionPending && (
            <>
              {/* Mint out progress bar */}
              <Progress
                value={(collection.num_items / collection.max_items) * 100}
              />
              <p className="text-center">
                {collection?.num_items} / {collection?.max_items}
              </p>
            </>
          )}
        </div>
        <div className="flex flex-col gap-4">
          {/* Displaying invite lists */}
          {!isPending &&
            inviteLists?.map((list: any) => (
              <InviteList key={list.id} list={list} collection={collection} />
            ))}
          {isPending && <p className="text-center">LOADING...</p>}
        </div>
      </main>
    </div>
  );
}

function InviteList({
  list,
  collection,
}: {
  list: {
    id: string;
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

  // Technically the max limit on our contract is 4294967295, we treat this as unlimited
  const MAX_LIMIT = 4294967295;
  const hasWalletLimit = list.wallet_limit !== MAX_LIMIT;
  const hasListLimit = list.list_limit !== MAX_LIMIT;

  const price =
    list.token_price === "0"
      ? "FREE"
      : `${list.token_price} ${list.currency_symbol}`;

  // To check how much is minted on particular lists, we can read from the contract directly
  // This is the mint limit for the entire list
  const { data: listMinted } = useReadContract({
    abi: collection.abi,
    address: collection.address as `0x${string}`,
    functionName: "listSupply",
    chainId: collection.chain_id,
    args: [list.root],
  }) as { data: number };

  // This is the limit for individual wallets on the list
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

  // Minting function
  const { mutate: mint, isPending } = useMutation({
    mutationFn: async (listId: string) => {
      // First we can hit the Scatter API to generate the mint transaction data for us
      const response = await fetch(`${SCATTER_API_URL}/mint`, {
        method: "POST",
        body: JSON.stringify({
          collectionAddress: collection.address,
          chainId: collection.chain_id,
          minterAddress: address,
          // Hardcoded quantities to 1 for this example, you could expand this to take any amount
          // or support minting from multiple lists at once
          lists: [{ id: listId, quantity: 1 }],
        }),
      }).then((res) => res.json());

      const mintTransaction = response.mintTransaction;

      // If the mint costs ERC20s, we need to approve them first or the mint will fail
      // if the mint is just with the native token (eg. ETH), we can ignore this step
      for (const erc20 of response.erc20s) {
        // Check if the user has enough allowance for the mint already
        const allowance = await readContract(config, {
          abi: erc20Abi,
          address: erc20.address,
          functionName: "allowance",
          args: [address as `0x${string}`, collection.address as `0x${string}`],
        });

        // If not, approve the max amount before minting
        if (allowance < BigInt(erc20.amount)) {
          await writeContract(config, {
            abi: erc20Abi,
            address: erc20.address,
            functionName: "approve",
            chainId: collection.chain_id,
            args: [collection.address as `0x${string}`, maxUint256],
          });
        }
      }

      // Now we trigger the mint transaction
      await sendTransaction(config, {
        account: address,
        to: collection.address as `0x${string}`,
        value: BigInt(mintTransaction.value),
        data: mintTransaction.data,
        chainId: collection.chain_id,
      });
    },
    onError: (error) => {
      console.error("Mint mutation failed:", error);
    },
  });

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
              className="h-full cursor-pointer"
              disabled={!isConnected || isListMintedOut || isPending}
              onClick={() => mint(list.id)}
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
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
