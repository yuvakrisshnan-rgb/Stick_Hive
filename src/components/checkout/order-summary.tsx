"use client";

import {
  useShop,
} from "@/components/shop/store-provider";



export default function OrderSummary() {


  const {
    cartLines,
    cartSubtotal,
  } = useShop();



  const shipping =

    cartSubtotal >= 499

      ? 0

      : 40;



  const total =
    cartSubtotal + shipping;



  return (

    <section

      className="
        rounded-[2rem]
        bg-white
        p-8
        shadow-xl
      "

    >


      {/* Heading */}

      <h2

        className="
          text-2xl
          font-extrabold
        "

      >

        Your Order

      </h2>



      {/* Products */}

      <div

        className="
          mt-6
          space-y-4
        "

      >


        {

          cartLines.length > 0 ? (

            cartLines.map((line) => (

              <div

                key={
                  `${line.product.id}-${line.size}`
                }

                className="
                  flex
                  items-center
                  justify-between
                  gap-4
                "

              >


                <div>

                  <p

                    className="
                      font-bold
                    "

                  >

                    {line.product.name}

                  </p>



                  <p

                    className="
                      text-sm
                      text-black/50
                    "

                  >

                    {line.size}
                    {" × "}
                    {line.quantity}

                  </p>

                </div>



                <p

                  className="
                    font-bold
                    whitespace-nowrap
                  "

                >

                  ₹{line.lineTotal}

                </p>


              </div>

            ))

          ) : (

            <p

              className="
                py-6
                text-center
                text-sm
                text-black/40
              "

            >

              Your cart is empty.

            </p>

          )

        }


      </div>



      {/* Divider */}

      <div

        className="
          mt-8
          border-t
          border-black/10
          pt-6
        "

      >


        {/* Subtotal */}

        <div

          className="
            flex
            items-center
            justify-between
          "

        >

          <span>

            Subtotal

          </span>


          <span>

            ₹{cartSubtotal}

          </span>

        </div>



        {/* Shipping */}

        <div

          className="
            mt-3
            flex
            items-center
            justify-between
          "

        >

          <span>

            Shipping

          </span>


          <span>

            {
              shipping === 0

                ? "FREE"

                : `₹${shipping}`
            }

          </span>

        </div>



        {/* Total */}

        <div

          className="
            mt-4
            flex
            items-center
            justify-between
            text-xl
            font-extrabold
          "

        >

          <span>

            Total

          </span>


          <span>

            ₹{total}

          </span>

        </div>


      </div>


    </section>

  );

}