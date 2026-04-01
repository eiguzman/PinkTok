// search.js

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Select existing search-wrapper div from HTML
    const searchWrapper = document.querySelector('.search-wrapper');
    if (!searchWrapper) {
        console.error('No element with class "search-wrapper" found in the HTML.');
        return;
    }

    // Create search container div
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';

    // Create icon
    const searchIcon = document.createElement('div');
    searchIcon.className = 'search-icon';
    searchIcon.textContent = '🔍';

    // Create input element
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search products (separate keywords with commas to search for multiple brands)';
    searchInput.className = 'search-input';

    // Append input to search container
    searchContainer.appendChild(searchIcon);
    searchContainer.appendChild(searchInput);

    // Create sort container
    const sortContainer = document.createElement('div');
    sortContainer.className = 'sort-container';

    // Create "Sort By" button
    const sortButton = document.createElement('div');
    sortButton.className = 'sort-button';
    sortButton.textContent = 'Sort By ▼';

    // Create dropdown menu
    const sortDropdown = document.createElement('div');
    sortDropdown.className = 'sort-dropdown';

    const options = [
        { label: 'Title (A-Z)', value: 'az' },
        { label: 'Title (Z-A)', value: 'za' },
        { label: 'Price (Low to High)', value: 'low' },
        { label: 'Price (High to Low)', value: 'high' }
    ];

    options.forEach(opt => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'sort-option';
        optionDiv.textContent = opt.label;
        optionDiv.dataset.value = opt.value;
        sortDropdown.appendChild(optionDiv);
    });

    // Append dropdown to sort container
    sortContainer.appendChild(sortButton);
    sortContainer.appendChild(sortDropdown);

    // Append search and sort containers to existing search-wrapper
    searchWrapper.appendChild(searchContainer);
    searchWrapper.appendChild(sortContainer);

    // Select container with products
    const container = document.querySelector('.shell');

    // Select counter element
    const counterElement = document.querySelector('.counter');

    // Create a no-results message element
    const noResultsDiv = document.createElement('div');
    noResultsDiv.className = 'no-results-message';
    noResultsDiv.textContent = 'No Results Found. Try Another Search.';

    // Append no-results message to container
    container.appendChild(noResultsDiv);

    // Helper function to remove punctuation except commas
    const normalizeString = (str) => {
        // Remove all punctuation except commas
        // Punctuation characters: !"#$%&'()*+./:;<=>?@[$$^_`{|}~
        return str.replace(/[!"#$%&'()*+./:;<=>?@[\$$^_`{|}~]/g, '').toLowerCase();
    };

    // Function to update counter
    const updateCounter = () => {
        const visibleProducts = Array.from(container.querySelectorAll('.container'))
            .filter(div => div.style.display !== 'none');

        const count = visibleProducts.length;
        if (counterElement) {
            counterElement.textContent = `Showing ${count} Items`;
        }
    };

    document.addEventListener('productsLoaded', () => {
        updateCounter();
    });

    // Function to show or hide "No Results" message
    const checkNoResults = () => {
        const visibleProducts = Array.from(container.querySelectorAll('.container'))
            .filter(div => div.style.display !== 'none');

        if (visibleProducts.length === 0) {
            // Show "No Results" message
            noResultsDiv.style.display = 'block';
            // Optional: hide counter
            if (counterElement) {
                counterElement.textContent = '';
            }
        } else {
            // Hide "No Results" message
            noResultsDiv.style.display = 'none';
            // Update counter
            updateCounter();
        }
    };

    // Compute Levenshtein distance (edit distance)
    const levenshtein = (a, b) => {
        const matrix = Array.from({ length: a.length + 1 }, () => []);

        for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
        for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

        for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,     // deletion
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j - 1] + cost // substitution
                );
            }
        }

        return matrix[a.length][b.length];
    };

    // Fuzzy word comparison
    const fuzzyMatch = (word, productWord) => {
        // Exact or substring match (fast path)
        if (productWord.includes(word)) return true;

        // Strict plural handling only
        if (word.endsWith('s') && productWord === word.slice(0, -1)) return true;
        if (productWord.endsWith('s') && word === productWord.slice(0, -1)) return true;

        // First letter must match (eliminates most bad matches)
        if (word[0] !== productWord[0]) return false;

        // Length difference must be small
        if (Math.abs(word.length - productWord.length) > 1) return false;

        // Require strong prefix similarity
        if (word.slice(0, 3) !== productWord.slice(0, 3)) return false;

        // Now apply Levenshtein ONLY if it passes filters
        const distance = levenshtein(word, productWord);

        return distance === 1;
    };

    // Function to filter products based on input
    const filterProducts = () => {
        const query = searchInput.value.trim().toLowerCase();

        // Split into comma-separated groups (OR logic)
        const rawGroups = query.split(',').map(k => k.trim()).filter(k => k.length > 0);

        const productContainers = document.querySelectorAll('.container');

        productContainers.forEach(container => {
            const nameSpan = container.querySelector('.name-span');
            if (!nameSpan) return;

            const productNameRaw = nameSpan.textContent;
            const productNameNormalized = normalizeString(productNameRaw);

            // Split product name into words
            const productWords = productNameNormalized.split(/\s+/);

            // Check if ANY group matches (OR logic)
            const matches = rawGroups.some(group => {
                const normalizedGroup = normalizeString(group);

                // Split group into words (AND logic)
                const keywords = normalizedGroup.split(/\s+/);

                // Every keyword must exist somewhere in product words
                return keywords.every(word =>
                    productWords.some(productWord => fuzzyMatch(word, productWord))
                );
            });

            // Show or hide
            container.style.display = matches || rawGroups.length === 0 ? '' : 'none';
        });

        // After filtering, check for no results and update counter
        checkNoResults();
    };

    // Sorting state
    let currentSort = 'az';

    // Function to sort products
    const sortProducts = (criteria) => {
        const productDivs = Array.from(container.querySelectorAll('.container'));

        // Filter visible products only
        const visibleProducts = productDivs.filter(div => div.style.display !== 'none');

        visibleProducts.sort((a, b) => {
            const nameA = a.querySelector('.name-span')?.textContent.toLowerCase() || '';
            const nameB = b.querySelector('.name-span')?.textContent.toLowerCase() || '';

            const priceA = parseFloat(a.querySelector('.bef-span')?.textContent.replace(/[^0-9.-]+/g, '') || 0);
            const priceB = parseFloat(b.querySelector('.bef-span')?.textContent.replace(/[^0-9.-]+/g, '') || 0);

            switch (criteria) {
                case 'az':
                    return nameA.localeCompare(nameB);
                case 'za':
                    return nameB.localeCompare(nameA);
                case 'low':
                    return priceA - priceB;
                case 'high':
                    return priceB - priceA;
                default:
                    return 0;
            }
        });

        // Append sorted products back to container
        visibleProducts.forEach(div => {
            container.appendChild(div);
        });
    };

    // Event listener for search input
    searchInput.addEventListener('input', () => {
        filterProducts();
        // Update counter after filtering
        updateCounter();
    });

    // Toggle dropdown menu
    sortButton.addEventListener('click', () => {
        sortDropdown.classList.toggle('show');
    });

    // Handle clicking outside to close dropdown
    document.addEventListener('click', (e) => {
        if (!sortContainer.contains(e.target)) {
            sortDropdown.classList.remove('show');
        }
    });

    // Add event listeners for sorting options
    sortDropdown.querySelectorAll('.sort-option').forEach(option => {
        option.addEventListener('click', () => {
            const selectedSort = option.dataset.value;
            currentSort = selectedSort;
            // Update button text to reflect current sort
            let buttonText = 'Sort By ';
            switch (selectedSort) {
                case 'az':
                    buttonText = 'Title (A-Z) ▼';
                    break;
                case 'za':
                    buttonText = 'Title (Z-A) ▼';
                    break;
                case 'low':
                    buttonText = 'Price (Low to High) ▼';
                    break;
                case 'high':
                    buttonText = 'Price (High to Low) ▼';
                    break;
            }
            sortButton.textContent = buttonText;

            // Perform sort
            sortProducts(selectedSort);
            // Close dropdown
            sortDropdown.classList.remove('show');

            // After sorting, update counter
            updateCounter();
        });
    });
});
