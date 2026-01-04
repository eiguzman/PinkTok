import json
from bs4 import BeautifulSoup

# Paths
html_file_path = '../raw/listings.html'
output_json_path = './products.json'

# Load HTML content
with open(html_file_path, 'r', encoding='utf-8') as file:
    html_content = file.read()

soup = BeautifulSoup(html_content, 'html.parser')

# Find all product blocks
product_divs = soup.find_all('div', class_='x9f619 x78zum5 x1r8uery xdt5ytf x1iyjqo2 xs83m0k x135b78x x11lfxj5 xexx8yu x18d9i69 xnpuxes x1cjf5ee x17dddeq')

products = []

for product_div in product_divs:
    product = {}

    # Extract the product name
    product_name_span = product_div.find('span', class_='x1lliihq x6ikm8r x10wlt62 x1n2onr6') 
    product['Product Name'] = product_name_span.text.strip()

    # Extract current price
    current_price_span = product_div.find('span', class_='x193iq5w xeuugli x13faqbe x1vvkbs x1xmvt09 x1lliihq x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x xudqn12 x676frb x1lkfr7t x1lbecb7 x1s688f xzsf02u')
    product['Current Price'] = current_price_span.text.strip()

    # Extract past price
    past_price_span = product_div.find('span', class_='x193iq5w xeuugli x13faqbe x1vvkbs x1xmvt09 x1lliihq x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x xudqn12 x676frb x1lkfr7t x1lbecb7 xk50ysn xi81zsa')
    if past_price_span:
        product['Past Price'] = past_price_span.text.strip()
    else:
        product['Past Price'] = ""

    # Extract link
    link_tag = product_div.find('a', href=True)
    link_href = link_tag["href"]
    link = ("https://facebook.com" + link_href)[:-61]
    product['Marketplace Link'] = link

    # Extract image src
    img_tag = link_tag.find('img', src=True) if link_tag else None
    product['Image Source'] = img_tag['src']

    products.append(product)

# Save to JSON
with open(output_json_path, 'w', encoding='utf-8') as json_file:
    json.dump(products, json_file, ensure_ascii=False, indent=4)

print(f"Extracted {len(products)} products and saved to {output_json_path}")
