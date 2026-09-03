import ShopCatalog from "@/components/shop/shop-catalog"


export default async function ShopPage({

  searchParams,

}: {

  searchParams: Promise<{
    search?: string
  }>

}) {


  const params = await searchParams


  return (

    <main>

      <ShopCatalog

        searchQuery={
          params.search ?? ""
        }

      />

    </main>

  )

}