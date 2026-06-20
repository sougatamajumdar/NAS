import requests
from bs4 import BeautifulSoup


def fetch_doc(url):
    response = requests.get(url)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    points = {}

    rows = soup.find_all("tr")

    for row in rows[1:]:
        col = [td.get_text(strip=True) for td in row.find_all(["td", "th"])]

        if len(col) != 3:
            continue

        try:
            x = int(col[0])
            char = col[1]
            y = int(col[2])

            points[(x, y)] = char

        except ValueError:
            continue

    return points


def generate_grid(url):
    points = fetch_doc(url)

    if not points:
        print("No data")
        return

    _x = max(x for x, y in points.keys())
    _y = max(y for x, y in points.keys())

    for y in range(_y, -1, -1):
        row = []

        for x in range(_x + 1):
            row.append(points.get((x, y), " "))

        print("".join(row))

  
url =" https://docs.google.com/document/d/e/2PACX-1vSvM5gDlNvt7npYHhp_XfsJvuntUhq184By5xO_pA4b_gCWeXb6dM6ZxwN8rE6S4ghUsCj2VKR21oEP/pub"
generate_grid(url)