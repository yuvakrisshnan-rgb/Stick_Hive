import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";



type InvoiceOrder = {

  orderId:string;

  createdAt:string;


  customer:{
    name:string;
    email:string;
    phone:string;
    address:string;
  };


  paymentMethod:string;
  paymentStatus?:string;
  paymentVerification?: { transactionId:string; utr?:string; paidAmount:number; paidAt:string; };


  items:{
    productName:string;
    imageUrl?:string;
    size:string;
    shape?:string;
    finish?:string;
    quantity:number;
    lineTotal:number;
  }[];


  subtotal:number;

  shipping:number;

  total:number;

};





// --------------------------------------------------
// IMAGE LOADER FOR PDF
// --------------------------------------------------


function loadImage(

src:string

):Promise<string | null>{


return new Promise((resolve)=>{


const img = new Image();



img.crossOrigin = "anonymous";



img.onload = ()=>{


const canvas =

document.createElement("canvas");



canvas.width = img.width;

canvas.height = img.height;



const ctx =

canvas.getContext("2d");



if(ctx){


ctx.drawImage(

img,

0,

0

);


resolve(

canvas.toDataURL(

"image/png"

)

);


}

else{


resolve(null);


}


};





img.onerror = ()=>{


console.warn(

"Unable to load image:",

src

);


resolve(null);


};





img.src = src;



});


}









// --------------------------------------------------
// GENERATE INVOICE
// --------------------------------------------------


export async function generateInvoice(

order:InvoiceOrder

){



try{



const doc = new jsPDF();





// --------------------------------------------------
// COLORS
// --------------------------------------------------


const honeyYellow = "#FF6A00";

const cream = "#FFF8ED";

const black = "#111111";

const grey = "#666666";









// --------------------------------------------------
// BACKGROUND
// --------------------------------------------------


doc.setFillColor(

cream

);


doc.rect(

0,

0,

210,

297,

"F"

);









// --------------------------------------------------
// HEADER
// --------------------------------------------------


doc.setFillColor(

honeyYellow

);


doc.roundedRect(

10,

10,

190,

50,

8,

8,

"F"

);







// LOGO


const logo = await loadImage(

"/brand/stickhive-bee-logo.png"

);



if(logo){


doc.addImage(

logo,

"PNG",

18,

18,

32,

32

);


}






doc.setTextColor(

black

);



doc.setFont(

"helvetica",

"bold"

);



doc.setFontSize(22);



doc.text(

"Stick Hive",

60,

32

);





doc.setFont(

"helvetica",

"normal"

);



doc.setFontSize(9);



doc.text(

"IDEAS FIND A HOME",

60,

40

);









doc.setFont(

"helvetica",

"bold"

);



doc.setFontSize(18);



doc.text(

"INVOICE",

150,

35

);









// --------------------------------------------------
// DETAILS
// --------------------------------------------------


let y = 78;



doc.setFontSize(11);



doc.setTextColor(

black

);



doc.text(

"Invoice Details",

20,

y

);





doc.setFont(

"helvetica",

"normal"

);



doc.setTextColor(

grey

);



y += 10;



const invoiceNumber =

`INV-SH-${new Date(order.createdAt).getFullYear()}-${order.orderId.slice(-6)}`;



doc.text(

`Invoice No: ${invoiceNumber}`,

20,

y

);



y += 8;



doc.text(

`Order ID: ${order.orderId}`,

20,

y

);



y += 8;



doc.text(

`Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}`,

20,

y

);









// --------------------------------------------------
// PAYMENT BADGE
// --------------------------------------------------


doc.setFillColor(

220,

255,

220

);



doc.roundedRect(

130,

75,

60,

18,

4,

4,

"F"

);





doc.setTextColor(

40,

120,

40

);



doc.setFontSize(8);



doc.setFont(

"helvetica",

"bold"

);



doc.text(

"PAYMENT CONFIRMED",

135,

86

);









// --------------------------------------------------
// CUSTOMER
// --------------------------------------------------


y += 25;



doc.setTextColor(

black

);



doc.setFontSize(12);



doc.setFont(

"helvetica",

"bold"

);



doc.text(

"BILL TO",

20,

y

);





doc.setFont(

"helvetica",

"normal"

);



doc.setFontSize(10);



doc.setTextColor(

grey

);



y += 10;



doc.text(

order.customer.name,

20,

y

);



y += 7;



doc.text(

order.customer.email,

20,

y

);



y += 7;



doc.text(

order.customer.phone,

20,

y

);



y += 7;



doc.text(

order.customer.address,

20,

y

);









// --------------------------------------------------
// ITEMS
// --------------------------------------------------


const tableStart = y + 18;





autoTable(doc,{

startY:tableStart,


head:[

[
"Sticker",
"Details",
"Qty",
"Amount"
]

],



body:

order.items.map((item)=>([


item.productName,



`${item.size}${

item.shape

?

` • ${item.shape}`

:

""

}${

item.finish

?

` • ${item.finish}`

:

""

}`,



item.quantity.toString(),



`₹${item.lineTotal}`


])),



theme:"grid",




headStyles:{


fillColor:honeyYellow,

textColor:black,


fontStyle:"bold"

},




styles:{


fontSize:9,

cellPadding:5

}



});









const finalY =

(doc as any)

.lastAutoTable

.finalY + 15;









// --------------------------------------------------
// TOTALS
// --------------------------------------------------


doc.setTextColor(

black

);



doc.setFontSize(11);



doc.text(

`Subtotal : ₹${order.subtotal}`,

120,

finalY

);



doc.text(

`Shipping : ${

order.shipping === 0

?

"FREE"

:

`₹${order.shipping}`

}`,

120,

finalY + 8

);





doc.setFont(

"helvetica",

"bold"

);



doc.setFontSize(15);



doc.text(

`TOTAL : ₹${order.total}`,

120,

finalY + 22

);









// --------------------------------------------------
// QR CODE
// --------------------------------------------------


const qr = await loadImage(

"/dummy/payment-qr.png"

);



if(qr){


doc.addImage(

qr,

"PNG",

20,

finalY,

35,

35

);



doc.setFontSize(8);



doc.setFont(

"helvetica",

"normal"

);



doc.text(

"Scan to visit Stick Hive",

20,

finalY + 42

);



}









// --------------------------------------------------
// FOOTER
// --------------------------------------------------


doc.setDrawColor(

180,

180,

180

);



doc.line(

20,

270,

190,

270

);



doc.setFontSize(10);



doc.setTextColor(

grey

);



doc.text(

"THANK YOU FOR JOINING THE HIVE",

20,

282

);



doc.text(

"Keep creating. Keep sticking.",

20,

288

);









// --------------------------------------------------
// DOWNLOAD
// --------------------------------------------------


doc.save(

`Stick-Hive-Invoice-${order.orderId}.pdf`

);



}

catch(error){



console.error(

"Invoice generation failed:",

error

);



throw error;



}



}