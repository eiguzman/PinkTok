// products.js

// Reduces .html file size from 15k lines to <40

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Fetch products data
    fetch('./data/clean/products.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(products => {
            const shellDiv = document.querySelector('.shell');
            if (!shellDiv) {
                console.error('No element with class "shell" found.');
                return;
            }

            // Iterate over each product and create HTML structure
            products.forEach(product => {
                // Destructure product properties with defaults
                const {
                    "Product Name": name,
                    "Current Price": currentPrice,
                    "Past Price": pastPrice,
                    "Marketplace Link": link,
                    "Image Source": imageSrc
                } = product;

                // Create container div
                const containerDiv = document.createElement('div');
                containerDiv.className = 'container';

                // Create anchor element
                const anchor = document.createElement('a');
                anchor.className = 'marketplace-link';
                anchor.href = link;
                anchor.target = '_blank'; // Open links in new tab
                anchor.setAttribute('rel', 'noopener noreferrer');
                // Alternatively, open links in same tab
                // anchor.setAttribute('tabindex', '0');

                // Create main split div
                const splitDiv = document.createElement('div');
                splitDiv.className = 'img-txt-split';

                // Create image container
                const imgContainer = document.createElement('div');
                imgContainer.className = 'img-container';

                // Create image element
                const img = document.createElement('img');
                img.className = 'image';
                img.alt = `${name} in San Diego, CA`;
                img.referrerPolicy = 'origin-when-cross-origin';
                img.src = imageSrc;

                // Append image to image container
                imgContainer.appendChild(img);

                // Create text container
                const txtContainer = document.createElement('div');
                txtContainer.className = 'txt-container';

                // Create first txt div for prices
                const priceTxtDiv = document.createElement('div');
                priceTxtDiv.className = 'txt';

                // Create be-aft container
                const beAftContainer = document.createElement('div');
                beAftContainer.className = 'bef-aft-container';

                // Create be-span for current price
                const beSpan = document.createElement('span');
                beSpan.className = 'bef-span';
                beSpan.dir = 'auto';
                beSpan.textContent = currentPrice;

                // Create aft-span for past price
                const aftSpan = document.createElement('span');
                aftSpan.className = 'aft-span';
                aftSpan.dir = 'auto';
                aftSpan.textContent = pastPrice;

                // Append spans to be-aft container
                beAftContainer.appendChild(beSpan);
                beAftContainer.appendChild(aftSpan);

                // Append be-aft container to price txt
                priceTxtDiv.appendChild(beAftContainer);

                // Create second txt div for product name
                const nameTxtDiv = document.createElement('div');
                nameTxtDiv.className = 'txt';

                // Create name-span for product name
                const nameSpan = document.createElement('span');
                nameSpan.className = 'name-span';
                nameSpan.setAttribute('dir', 'auto');
                nameSpan.textContent = name;

                // Append name-span to txt container
                nameTxtDiv.appendChild(nameSpan);

                // Append price and name divs to txt-container
                txtContainer.appendChild(priceTxtDiv);
                txtContainer.appendChild(nameTxtDiv);

                // Append txt-container to split div
                splitDiv.appendChild(imgContainer);
                splitDiv.appendChild(txtContainer);

                // Append split div to anchor
                anchor.appendChild(splitDiv);

                // Append anchor to container div
                containerDiv.appendChild(anchor);

                // Append container to shell
                shellDiv.appendChild(containerDiv);
            });

            // Ping that products have finished loading
            const event = new CustomEvent('productsLoaded');
            document.dispatchEvent(event);
        })

        // Products file is misplaced or DNE, or the fetch path is incorrect
        .catch(error => {
            console.error('Error fetching products.json:', error);
        });
});