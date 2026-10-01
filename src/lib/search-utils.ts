import {
  type Product,
} from "@/lib/product-data";


// ==========================================
// NORMALIZE SEARCH TEXT
// ==========================================

export function normalizeSearch(
  value:string
){

  return value
    .toLowerCase()
    .trim();

}



// ==========================================
// SEARCH PRODUCTS
// ==========================================
// Takes the product list as a parameter instead of importing the static
// PRODUCTS array directly - callers (the navbar's quick search) need to
// search whatever catalog is actually live (the real D1 catalog once
// PRODUCTS_SOURCE=d1, not the 30-item static demo array), which only a
// client component holding that state can supply.

export function searchProducts(
  query:string,
  products: Product[],
): Product[] {


  const search =
    normalizeSearch(query);



  // return all products
  // if search is empty

  if(!search){

    return products;

  }



  return products.filter(
    (product)=>{


      const searchableText = [

        product.name,

        product.category,

        product.collection ?? "",

        ...product.tags,

      ]

      .join(" ")

      .toLowerCase();



      return searchableText.includes(
        search
      );


    }
  );


}



// ==========================================
// POPULAR SEARCHES
// ==========================================

export const POPULAR_SEARCHES = [

  "Anime",

  "Gaming",

  "Marvel",

  "Cute",

  "Nature",

  "Technology",

];



// ==========================================
// SEARCH SUGGESTIONS
// ==========================================

export function getSuggestions(
  query:string,
  products: Product[],
){


  if(!query){

    return POPULAR_SEARCHES;

  }



  return searchProducts(query, products)

    .slice(0,5)

    .map(
      product=>product.name
    );


}