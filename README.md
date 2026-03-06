# Kaffeshop

## Beskrivning
En fullstack webbapplikation för en kaffeshop med produkthantering och ordervisning. Backend byggd med Node.js/Express och MySQL, frontend med vanilla HTML, CSS och JavaScript.

## Installation

### Databas
1. Öppna MySQL Workbench
2. Skapa databasen `kaffeshop`
3. Kör `schema.sql` för att skapa tabellerna
4. Kör `testdata.sql` för att lägga in testdata

### Backend
1. Gå till projektmappen: `cd kaffe-shop-main`
2. Installera dependencies: `npm install`
3. Skapa `.env`-fil:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=ditt_lösenord
DB_NAME=kaffeshop
```
4. Starta servern: `node index.js`

### Frontend
1. Öppna `index.html` med Live Server i VS Code
2. Eller öppna filen direkt i webbläsaren

## Funktioner
- Visa alla produkter
- Filtrera produkter efter kategori
- Skapa ny produkt via formulär med validering
- Ta bort produkt med bekräftelsedialog
- Hämta order med JOIN-query (order + items + produktinfo)
- Input-validering i både frontend och backend
- XSS-skydd med escapeHtml()
- Felhantering med HTTP-statuskoder (201, 204, 400, 404, 500)

## API Endpoints
| Metod | Route | Beskrivning |
|-------|-------|-------------|
| GET | /products | Hämta alla produkter (stöder ?category_id=) |
| GET | /products/:id | Hämta en produkt |
| POST | /products | Skapa ny produkt (med validering) |
| PUT | /products/:id | Uppdatera produkt |
| DELETE | /products/:id | Ta bort produkt |
| GET | /categories | Hämta alla kategorier |
| GET | /users | Hämta alla användare |
| GET | /orders | Hämta alla ordrar |
| GET | /orders/:id/join | Order med items (JOIN) |

## Tekniker
- Node.js / Express
- MySQL (mysql2)
- HTML / CSS / JavaScript
- dotenv (miljövariabler)
- cors (cross-origin requests)

## Gruppmedlemmar
- Mustafa
- Bleart
