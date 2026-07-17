# QuranTracker

Qur'on yodlash va statistika kuzatish tizimi (Fullstack Web App).

## 🚀 Texnologiyalar
- **Frontend**: React, TypeScript, Vite, CSS (Sleek Dark Mode, Glassmorphism, 100% viewport, responsive)
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, JWT, Bcrypt
- **Database**: MySQL (tizimga moslangan relational schema)

## 📦 O'rnatish va Ishga Tushirish

1. **Kutubxonalarni o'rnatish**:
   ```bash
   npm run install:all
   ```

2. **Sozlamalar (.env)**:
   `server/.env` faylida o'zingizning MySQL ma'lumotlar bazasi ulanish manzili va JWT maxfiy kalitini yozing:
   ```env
   DATABASE_URL="mysql://username:password@localhost:3306/quran_tracker"
   JWT_SECRET="maxfiy_jwt_kalit"
   ```

3. **Prisma Migratsiyasini bajarish**:
   ```bash
   npm run prisma:migrate --prefix server
   npm run prisma:seed --prefix server
   ```

4. **Dasturni ishga tushirish**:
   ```bash
   npm run dev
   ```

5. Saytga kirish:
   - **Frontend**: http://localhost:5173/
   - **Backend**: http://localhost:5000/
