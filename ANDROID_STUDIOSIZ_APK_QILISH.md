# Android Studio'siz APK chiqarish yo'riqnomasi

Bu loyiha Android Studio o'rnatmasdan GitHub Actions orqali APK chiqarishga tayyorlangan.

## 1-usul: GitHub orqali APK chiqarish

1. github.com saytiga kiring.
2. Yangi repository oching. Masalan: `tort-house-zakaz-app`.
3. Ushbu loyiha ichidagi hamma fayllarni repository'ga yuklang.
4. GitHub'da repository ichida **Actions** bo'limiga kiring.
5. **Build Tort House Zakaz APK** workflow'ini tanlang.
6. **Run workflow** tugmasini bosing.
7. Build tugagach, pastdagi **Artifacts** bo'limidan `TortHouseZakaz-debug-apk` faylini yuklab oling.
8. Ichidan `app-debug.apk` chiqadi.
9. Shu APK'ni telefonga yuborib o'rnating.

## Telefonga o'rnatishda

Android telefon APK'ni birinchi marta o'rnatayotganda quyidagi ruxsatni so'rashi mumkin:

- Install unknown apps
- Разрешить установку из неизвестных источников

Chrome yoki Files ilovasiga shu ruxsatni bering.

## Muhim

Bu debug APK. Test uchun ishlaydi. Xodimlarga doimiy tarqatishdan oldin release APK qilib imzolash tavsiya qilinadi.

## Ilova haqida

- Ilova nomi: Tort House Zakaz
- Package: uz.torthouse.zakaz
- Platforma: Android WebView
- Ichida zakaz qabul qilish PWA fayllari joylangan
