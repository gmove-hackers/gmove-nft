import { Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";

import { Mint } from "@/pages/Mint";
import { CreateCollection } from "@/pages/CreateCollection";
import { Collections } from "@/pages/Collections";
import { CraftNFT } from "./pages/CraftNFT";
import { CollectionDetail } from "./pages/CollectionDetail";

function Layout() {
  return (
    <>
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <Mint />,
      },
      {
        path: "create-collection",
        element: <CreateCollection />,
      },
      {
        path: "collections",
        element: <Collections />,
      },
      {
        path: "collection/:collection_id",
        element: <CollectionDetail />,
      },
      {
        path: "craft-nft",
        element: <CraftNFT />,
      },
    ],
  },
]);

function App() {
  return (
    <>
      <div className="bg-bg bg-cover bg-center min-h-screen text-primary-foreground">
        <RouterProvider router={router} />
      </div>
    </>
  );
}

export default App;
