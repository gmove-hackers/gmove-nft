import { LaunchpadHeader } from "@/components/LaunchpadHeader";
import { aptosClient } from "@/utils/aptosClient";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ImageMetadata } from "@/utils/assetsUploader";
import { IpfsImage } from "@/components/IpfsImage";
import { Button } from "@/components/ui/button";
import { combineNFT } from "@/entry-functions/combine_nft";
import { getIpfsJsonContent } from "@/utils/getIpfsJsonContent";
import { useQueryClient } from "@tanstack/react-query";

interface NFT {
  id: string;
  collection_id: string;
  name: string;
  image: string;
}

interface Token {
  current_token_data: {
    collection_id: string;
    token_name: string;
    token_uri: string;
    token_data_id: string;
  };
}

export function CraftNFT() {
  const { account, signAndSubmitTransaction } = useWallet();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const [allNFTs, setAllNFTs] = useState<NFT[]>([]);
  const [selectedNFT1, setSelectedNFT1] = useState<NFT | null>(null);
  const [selectedNFT2, setSelectedNFT2] = useState<NFT | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Function to fetch NFTs for the connected wallet
  useEffect(() => {
    const fetchNFTs = async () => {
      if (!account) return;

      try {
        // Fetch all tokens owned by the account using getAccountOwnedTokens
        const tokens = (await aptosClient().getAccountOwnedTokens({ accountAddress: account.address })) as Token[];

        if (!tokens || tokens.length === 0) {
          return;
        }

        // Fetch token data for each token (assuming standard format)
        const fetchedNFTs: NFT[] = await Promise.all(
          tokens.map(async (token) => {
            const { collection_id, token_name, token_uri, token_data_id } = token.current_token_data;

            const metadata = (await getIpfsJsonContent(token_uri)) as ImageMetadata;

            let image = metadata.image;

            // If combined NFT, set the proper image
            if (metadata.combinations) {
              const combinedName = Object.keys(metadata.combinations).find((key) => key === token_name);
              if (combinedName) {
                const combinedMetadata = (await getIpfsJsonContent(
                  metadata.combinations[combinedName],
                )) as ImageMetadata;
                image = combinedMetadata.image;
              }
            }

            return {
              id: token_data_id,
              collection_id,
              name: token_name,
              image,
            };
          }),
        );

        setAllNFTs(fetchedNFTs);
      } catch (error) {
        console.error("Failed to fetch NFTs:", error);
      }
    };

    fetchNFTs();
  }, [account]);

  const handleAreaClick = (area: string) => {
    setSelectedArea(area);
    setIsModalOpen(true);
  };

  const handleNFTSelect = (nft: NFT) => {
    if (selectedArea === "area1") {
      if (selectedNFT1?.id === nft.id) {
        setSelectedNFT1(null);
      } else {
        setSelectedNFT1(nft);
      }
    } else if (selectedArea === "area2") {
      if (selectedNFT2?.id === nft.id) {
        setSelectedNFT2(null);
      } else {
        setSelectedNFT2(nft);
      }
    }
    setIsModalOpen(false);
  };

  // Combine NFT
  const handleSubmit = async () => {
    try {
      if (!selectedNFT1 || !selectedNFT2) return;
      if (isUploading) throw new Error("Uploading in progress");
      setIsUploading(true);

      // Submit a combine_nft entry function transaction
      const response = await signAndSubmitTransaction(
        combineNFT({
          main_collection_obj: selectedNFT1.collection_id,
          secondary_collection_obj: selectedNFT2.collection_id,
          main_nft: selectedNFT1.id,
          secondary_nft: selectedNFT2.id,
        }),
      );

      // Wait for the transaction to be commited to chain
      await aptosClient().waitForTransaction({
        transactionHash: response.hash,
      });
      await queryClient.invalidateQueries();
    } catch (error) {
      alert(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <LaunchpadHeader title="Craft NFT" />

      <div className="container mx-auto p-4 pb-16">
        <h2 className="text-3xl mb-8 text-center font-bold">Combine Your NFTs</h2>
        <div className="bg-summoningBoard bg-center bg-[length:120%] bg-no-repeat relative before:content-[''] before:block before:pt-[59%]">
          <div className="absolute w-full h-full top-0 left-0 pt-[16.5%]">
            <div className="flex justify-around items-start max-w-[52rem] mx-auto w-[61%]">
              <Area selectedNFT={selectedNFT1} onClick={() => handleAreaClick("area1")} type="main" />
              <Area selectedNFT={selectedNFT2} onClick={() => handleAreaClick("area2")} type="secondary" />
            </div>

            {/* Submit Button */}
            <div className="text-center pt-[1.8%] h-[14%]">
              <Button
                variant="plain"
                size="plain"
                onClick={handleSubmit}
                disabled={isUploading || !account || !selectedNFT1 || !selectedNFT2}
                className="px-[6.8%] h-full text-vw16 font-bold"
              >
                Craft
              </Button>
            </div>

            {/* Modal for selecting NFTs */}
            <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black opacity-80" />
                <Dialog.Content
                  className="fixed bg-white p-6 shadow-lg rounded-lg"
                  style={{
                    maxWidth: "600px",
                    maxHeight: "80%",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    overflow: "auto",
                  }}
                >
                  <Dialog.Title className="text-xl text-center mb-4 font-bold">Select an NFT</Dialog.Title>
                  <div className="grid grid-cols-3 gap-4">
                    {allNFTs.map((nft) => {
                      const isDisabled =
                        (selectedArea === "area1" && nft.id === selectedNFT2?.id) ||
                        (selectedArea === "area2" && nft.id === selectedNFT1?.id);
                      const isSelectedInSameArea =
                        (selectedArea === "area1" && nft.id === selectedNFT1?.id) ||
                        (selectedArea === "area2" && nft.id === selectedNFT2?.id);

                      return (
                        <div
                          key={nft.id}
                          className={`${isDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                          onClick={() => !isDisabled && handleNFTSelect(nft)}
                        >
                          <div
                            className={`relative p-2 border ${isSelectedInSameArea ? "border-2 border-green-400" : ""}`}
                          >
                            <div
                              className={`w-full h-full object-cover  ${isDisabled ? "opacity-50 grayscale-[50%]" : ""}`}
                            >
                              <IpfsImage ipfsUri={nft.image} />
                            </div>
                            {isDisabled && <div className="absolute inset-0 bg-black opacity-80"></div>}
                          </div>
                          <p className={`text-center pt-2 font-medium ${isDisabled ? "opacity-50" : ""}`}>{nft.name}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-end mt-6">
                    <Dialog.Close asChild>
                      <button className="px-4 py-2 bg-gray-500 text-white rounded">Cancel</button>
                    </Dialog.Close>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
      </div>
    </>
  );
}

interface AreaProps {
  selectedNFT: NFT | null;
  onClick: () => void;
  type: "main" | "secondary";
}

const Area = ({ selectedNFT, onClick, type }: AreaProps) => {
  return (
    <div className="bg-areaCard bg-contain bg-no-repeat w-1/3 relative before:content-[''] before:block before:pt-[141.31%]">
      <div className="absolute w-full h-full top-0 left-0 p-[6.5%] cursor-pointer text-primary" onClick={onClick}>
        {selectedNFT ? (
          <div>
            <div className="p-[9.3%]">
              <IpfsImage ipfsUri={selectedNFT.image} />
            </div>
            <p className="text-center pt-[9.3%] text-vw16 font-bold">{selectedNFT.name}</p>
          </div>
        ) : (
          <p className="absolute bottom-[19%] left-0 text-center w-full translate-y-1/2 text-vw16 font-medium">
            Click to select the
            <br />
            {type[0].toUpperCase() + type.slice(1)} NFT
          </p>
        )}
      </div>
    </div>
  );
};
