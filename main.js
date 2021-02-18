/**
 * @author Cioromela Valentin Stefan
 */

// Import Apify SDK. For more information, see https://sdk.apify.com/
const Apify = require('apify');


Apify.main(async () => {
    // Geting input for the actor.
    const input = await Apify.getInput();

    // Used it when more than one links where added.
    //const requestList = await Apify.openRequestList('start-urls', input);
    
    //   Here I put links that need to be scraped
    const requestQueue = await Apify.openRequestQueue();

    //   Because it's starting form one link,  it is added to the requestQueue instead of loading INPUT it to RequestList
    await requestQueue.addRequest(input);

    // Array  for products
    let output = [];

    // Getting data from the page
    const handlePageFunction = async ({ request, $ }) => {

        // This is our new scraping logic.
        if (request.userData.detailPage) {

            // console.log(request.userData.detailPage);
            // Making the object with the product detailes scraped from the page
            const results = {
                ProductName: $("[data-test='product-title']").text(),   // getting the name of the product from the title of page

                ProductUrl: request.url,

                Price: $("[data-test='product-price-primary'] > h2").text().replace(/£/g, ``),    // getting the price. It comes in a form like "123.45£" and the "£" is replace with £

                // Stock: stock    // Problem: the website shows the availability only if asked. A form is needed to be filled (with a postal code or city name) and a button needs to be pressed
            };

            // Adding the object to an array that contains all the scraped products
            output.push(results);

            // Save the objects to the datasets
            await Apify.pushData(results);  
        }


        // Enqueue new links 
        if (!request.userData.detailPage) {

            // Getting the links of every product on the page
            await Apify.utils.enqueueLinks({
                //limit: 5,
                $,
                requestQueue,
                //pseudoUrls: ['https://www.argos.co.uk/product/[.*]'],     // this will not work because there are multiple elements with a link for a single product
                selector: "[data-test='component-product-card-title']",    // selecting the links that are in the title
                baseUrl: request.loadedUrl,
                transformRequestFunction: req => {
                    req.userData.detailPage = true;     // used to differentiate the product links from the next page 
                    return req;
                },
            });

            // Getting the link of the next page
            await Apify.utils.enqueueLinks({
                $,
                requestQueue,
                selector: "[data-test='component-pagination-arrow-right']",
                baseUrl: request.loadedUrl,
                transformRequestFunction: req => {
                    req.userData.detailPage = false;    // for testing put TRUE and the link will end up in the OUTPUT file
                    return req;
                },
            });

        }

    };


    // Set up the crawler, passing two options object as an argument.
    const crawler = new Apify.CheerioCrawler({
        //requestList,
        requestQueue,
        handlePageFunction,
    });

    // Starting the CheerioCrawler
    await crawler.run();

    // Saving all the products in the OUTPUT file
    await Apify.setValue('OUTPUT', output);

    // Displaying in terminal the OUTPUT file
    //console.dir(output);
 
    // Used to verify the number of products
    console.log(output.length);   
});
