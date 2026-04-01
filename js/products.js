// products.js

// Reduces .html file size from 45k lines to <35

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
                    "Image Source": imageSrc,
                    "Description": description
                } = product;

                // Create container div
                const containerDiv = document.createElement('div');
                containerDiv.className = 'container';

                // Create anchor element
                const anchor = document.createElement('a');
                anchor.className = 'marketplace-link';
                anchor.href = "#";
                anchor.addEventListener('click', (e) => {
                    e.preventDefault();
                    openModal({ name, currentPrice, pastPrice, link, imageSrc, description });
                });
                anchor.setAttribute('rel', 'noopener noreferrer');

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

// Modal popup function
function openModal(product) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    // Modal container
    const modal = document.createElement('div');
    modal.className = 'modal';

    // Close button
    const closeBtn = document.createElement('span');
    closeBtn.className = 'modal-close';

    // Image
    const img = document.createElement('img');
    img.className = 'modal-image';
    img.src = product.imageSrc;
    img.alt = product.name;

    // Title
    const title = document.createElement('h2');
    title.textContent = product.name;

    // Price
    const price = document.createElement('p');
    price.innerHTML = `<strong>${product.currentPrice}</strong> <span class="old-price">${product.pastPrice}</span>`;

    // Description
    const desc = document.createElement('p');
    desc.textContent = product.description;

    // Redirect button
    const button = document.createElement('a');
    button.href = product.link;
    button.target = '_blank';
    button.textContent = 'View on Marketplace';
    button.className = 'modal-button';

    // Append elements
    modal.appendChild(closeBtn);
    modal.appendChild(img);
    modal.appendChild(title);
    modal.appendChild(price);
    modal.appendChild(desc);
    modal.appendChild(button);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Enable background blur
    document.body.classList.add('modal-open');

    // Close behaviors
    const closeModal = () => {
        overlay.remove();
        document.body.classList.remove('modal-open');
    };

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
}