import {
  PRODUCTS,
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

export function searchProducts(
  query:string
): Product[] {


  const search =
    normalizeSearch(query);



  // return all products
  // if search is empty

  if(!search){

    return PRODUCTS;

  }



  return PRODUCTS.filter(
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
  query:string
){


  if(!query){

    return POPULAR_SEARCHES;

  }



  return searchProducts(query)

    .slice(0,5)

    .map(
      product=>product.name
    );


}