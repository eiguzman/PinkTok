import json
import unicodedata
import re
from bs4 import BeautifulSoup

# Paths
html_file_path = '../raw/listings.html'
items_sold_json_path = '../raw/items_sold.json'
output_json_path = './products.json'


# Repair UTF-8 text that has been incorrectly decoded as Latin-1/Windows-1252.
#
# Example:
#   â  -> ’
#   â€œ  -> “
#   â€  -> ”
#
# This is intentionally separate from title matching so that descriptions
# can retain their original capitalization, punctuation, and newlines.
def repair_encoding(text):
    if not text:
        return ""

    text = str(text)

    # First try Latin-1. This handles strings such as:
    # â = U+00E2 U+0080 U+0099
    try:
        repaired = text.encode('latin1').decode('utf-8')
        text = repaired
    except (UnicodeEncodeError, UnicodeDecodeError):
        pass

    # Some Facebook exports may contain Windows-1252 characters rather than
    # strict Latin-1 characters. Try a second pass when appropriate.
    try:
        repaired = text.encode('cp1252').decode('utf-8')
        text = repaired
    except (UnicodeEncodeError, UnicodeDecodeError):
        pass

    return text


# Normalize titles strictly for matching.
#
# This does NOT modify the actual product name or description stored in the
# output. It is only used to make titles from listings.html and items_sold.json
# comparable.
def normalize_title(text):
    if not text:
        return ""

    text = repair_encoding(text)

    # Unicode normalization.
    text = unicodedata.normalize('NFKD', text)

    # Remove accent marks.
    text = ''.join(
        character
        for character in text
        if not unicodedata.combining(character)
    )

    # Treat common apostrophe/quote variants as the same character.
    text = (
        text
        .replace("’", "'")
        .replace("‘", "'")
        .replace("ʼ", "'")
        .replace("`", "'")
        .replace("´", "'")
        .replace("＇", "'")
    )

    # Normalize whitespace.
    text = re.sub(r'\s+', ' ', text)

    # Case-insensitive matching.
    return text.casefold().strip()


# Repair encoding in a description while preserving:
# - capitalization
# - punctuation
# - accents
# - blank lines
# - newlines
# - spacing
def clean_description(text):
    if not text:
        return ""

    return repair_encoding(str(text)).strip()


# Load HTML content
with open(html_file_path, 'r', encoding='utf-8') as file:
    html_content = file.read()

soup = BeautifulSoup(html_content, 'html.parser')


# Load items_sold.json
with open(items_sold_json_path, 'r', encoding='utf-8') as file:
    items_sold_data = json.load(file)


# Build lookup:
# normalized product title -> original product description
#
# The normalized title is used only as the lookup key.
# The description itself is cleaned only for encoding problems and otherwise
# left untouched.
description_lookup = {}

for item in items_sold_data.get("items_selling_v2", []):
    title = item.get("title", "")
    description = item.get("description", "")

    normalized_title = normalize_title(title)

    if normalized_title:
        description_lookup[normalized_title] = clean_description(description)


# Find all product blocks
product_divs = soup.find_all(
    'div',
    class_='x9f619 x78zum5 x1r8uery xdt5ytf x1iyjqo2 xs83m0k '
           'x135b78x x11lfxj5 xexx8yu x18d9i69 xnpuxes x1cjf5ee '
           'x17dddeq g175_150'
)

products = []


for product_div in product_divs:
    product = {}

    # Extract the product name
    product_name_span = product_div.find(
        'span',
        class_='x1lliihq x6ikm8r x10wlt62 x1n2onr6 xlyipyv xuxw1ft'
    )

    if not product_name_span:
        continue

    product_name = product_name_span.get_text(strip=True)
    product['Product Name'] = product_name


    # Extract current price
    current_price_span = product_div.find(
        'span',
        class_='x193iq5w xeuugli x13faqbe x1vvkbs x1xmvt09 x1lliihq '
               'x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x '
               'xudqn12 x676frb x1lkfr7t x1lbecb7 x1s688f xzsf02u'
    )

    if current_price_span:
        product['Current Price'] = current_price_span.get_text(strip=True)
    else:
        product['Current Price'] = ""


    # Extract past price
    past_price_span = product_div.find(
        'span',
        class_='x193iq5w xeuugli x13faqbe x1vvkbs x1xmvt09 x1lliihq '
               'x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x '
               'xudqn12 x676frb x1lkfr7t x1lbecb7 xk50ysn xi81zsa'
    )

    if past_price_span:
        product['Past Price'] = past_price_span.get_text(strip=True)
    else:
        product['Past Price'] = ""


    # Extract link
    link_tag = product_div.find('a', href=True)

    if link_tag:
        link_href = link_tag['href']
        link = ("https://facebook.com" + link_href)[:-61]
        product['Marketplace Link'] = link
    else:
        product['Marketplace Link'] = ""


    # Extract image src
    img_tag = link_tag.find('img', src=True) if link_tag else None

    if img_tag:
        product['Image Source'] = img_tag['src']
    else:
        product['Image Source'] = ""


    # Match description using normalized product titles.
    #
    # listings.html may contain:
    #     Bob’s Phone
    #
    # while items_sold.json may contain mojibake:
    #     Bobâs Phone
    #
    # normalize_title() makes both equivalent for lookup purposes.
    normalized_name = normalize_title(product_name)

    raw_description = description_lookup.get(
        normalized_name,
        "Full description available on FB Marketplace"
    )

    # Preserve the description exactly as represented in items_sold.json,
    # apart from repairing encoding corruption.
    product['Description'] = clean_description(raw_description)

    products.append(product)


# Save to JSON
with open(output_json_path, 'w', encoding='utf-8') as json_file:
    json.dump(
        products,
        json_file,
        ensure_ascii=False,
        indent=4
    )

print(f"Extracted {len(products)} products and saved to {output_json_path}")