import { Image } from "@/components/ui/image";
import { ipfs } from "@/utils/assetsUploader";
import { convertIpfsUriToCid } from "@/utils/convertIpfsUriToCid";
import { useQuery } from "@tanstack/react-query";

interface IpfsImageProps {
  ipfsUri: string;
  type?: string;
}

export const IpfsImage: React.FC<IpfsImageProps> = ({ ipfsUri, type }) => {
  const imageData = useQuery({
    queryKey: ["ipfsImage", ipfsUri],
    queryFn: async () => {
      try {
        // Retrieve the image from IPFS
        const stream = ipfs.cat(convertIpfsUriToCid(ipfsUri));

        // Convert stream to a Blob
        const chunks: Uint8Array[] = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }

        // Create a Blob from the chunks
        const blob = new Blob(chunks, { type: "image/png" }); // Assuming the image type is PNG, adjust if necessary

        // Convert Blob to a Data URL
        const imageUrl = URL.createObjectURL(blob);

        return imageUrl;
      } catch (error) {
        console.error(`Error fetching from ${ipfsUri}:`, error);
        return null;
      }
    },
  });

  const imageSrc = imageData?.data;

  return (
    <div>
      {imageSrc ? (
        <Image src={imageSrc} rounded className={type === "collection" ? "w-10 h-10 bg-gray-100 shrink-0" : ""} />
      ) : null}
    </div>
  );
};
