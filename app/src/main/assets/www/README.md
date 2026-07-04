# Tort House Zakaz App v1

Bu paket Tort House zakaz qabul qilish uchun ishlaydigan mobil web-app/PWA 1-versiya.

## Ishlatish
1. `index.html` faylini Chrome brauzerda oching.
2. Telefon brauzerida ochilsa, “Add to Home Screen / Bosh ekranga qo‘shish” orqali ilovadek ishlatish mumkin.
3. Sozlama bo‘limida Operator ismi, Filial, Telegram Bot token va Chat ID kiriting.
4. Yangi zakaz kiriting va saqlang.
5. Zakazlar bo‘limidan CSV eksport qiling. CSV Excelda ochiladi.

## Funksiyalar
- Avtomatik ID: TH-000103072026 formatida
- Har kuni 0001 dan boshlash
- Majburiy maydonlar validatsiyasi
- Telefon maskasi: +998
- Narx, zakolat, qoldi hisoblash
- Rasm yuklash/kamera
- Lokal saqlash
- CSV/Excel eksport
- Telegramga yuborish
- XP-80 uchun chek ko‘rinishi va print
- Qidiruv/filter

## Telegram ishlashi uchun
Brauzerdan to‘g‘ridan-to‘g‘ri Telegram API ishlamasligi mumkin. Bunday holatda:
1. Google Apps Script oching.
2. `apps_script_proxy.gs` ichidagi kodni joylang.
3. `Deploy > New deployment > Web app` qiling.
4. Web App URL ni programmada `Apps Script Web App URL` maydoniga kiriting.

## Google Sheets
`apps_script_proxy.gs` ichidagi `SHEET_ID` ni o‘zingizning Google Sheets ID bilan almashtiring.
Sheet nomi `Zakazlar` bo‘lishi kerak.

## XP-80 printer
Hozirgi v1 brauzer print orqali 80 mm chek matnini chiqaradi. Real XP-80 Bluetooth/USB ESC/POS to‘g‘ridan-to‘g‘ri chop etish uchun Flutter/Android native modul kerak bo‘ladi.

## Muhim cheklov
Bu v1 ishlaydigan PWA/prototip. To‘liq APK, printerga native ulanish, server sinxronlash va Google Drive rasm yuklash uchun keyingi versiyada Android/Flutter build kerak bo‘ladi.
