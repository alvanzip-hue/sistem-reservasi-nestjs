# Sistem Reservasi Lapangan Olahraga — REST API NestJS

Kuis Proyek Individu • Sesi 5 • Praktek Pemrograman Web 3 (NestJS)

|               |                                     |
| ------------- | ----------------------------------- |
| Nama          | Alvan Dhan                          |
| NIM           | 240514004                           |
| Program Studi | Sistem Informasi, IDE LPKIA Bandung |

## Deskripsi

REST API untuk melihat jadwal lapangan, memesan slot waktu, melihat reservasi, dan membatalkan booking. Sesuai ketentuan kuis:

- Dibuat dengan **NestJS** (Controller + Service)
- Data disimpan sementara di **array** (in-memory), tanpa database — data kembali ke data awal saat server restart
- Request body berupa object biasa, **tanpa DTO / class-validator**
- Tanpa autentikasi dan tanpa frontend

## Cara Menjalankan

```bash
# install dependency
npm install

# jalankan mode development
npm run start:dev
```

Server berjalan di `http://localhost:3000`.

## Data Awal (Seed)

| id  | name                   | sportType | pricePerHour | status      |
| --- | ---------------------- | --------- | ------------ | ----------- |
| 1   | Lapangan Futsal A      | futsal    | 150000       | ACTIVE      |
| 2   | Lapangan Badminton 1   | badminton | 60000        | ACTIVE      |
| 3   | Lapangan Basket Indoor | basket    | 200000       | MAINTENANCE |

> Sesuaikan tabel ini dengan data seed di source code kamu.

## Daftar Endpoint

| Method | Endpoint                                   | Fungsi                                          |
| ------ | ------------------------------------------ | ----------------------------------------------- |
| GET    | `/fields`                                  | Daftar semua lapangan                           |
| GET    | `/fields/:id`                              | Detail satu lapangan                            |
| GET    | `/fields/:id/availability?date=YYYY-MM-DD` | Cek ketersediaan lapangan pada tanggal tertentu |
| POST   | `/bookings`                                | Membuat reservasi baru                          |
| GET    | `/bookings/:id`                            | Detail satu reservasi                           |
| GET    | `/users/:userId/bookings`                  | Daftar reservasi milik satu pengguna            |
| PATCH  | `/bookings/:id/cancel`                     | Membatalkan reservasi                           |

## Model Data

**Field**

```json
{
  "id": 1,
  "name": "Lapangan Futsal A",
  "sportType": "futsal",
  "pricePerHour": 150000,
  "status": "ACTIVE"
}
```

**Booking**

```json
{
  "id": 1,
  "fieldId": 2,
  "userId": 1,
  "customerName": "Budi",
  "date": "2026-11-05",
  "startTime": "18:00",
  "endTime": "19:00",
  "totalPrice": 60000,
  "status": "BOOKED"
}
```

Status booking: `BOOKED`, `CANCELLED`, `COMPLETED`.

## Aturan Bisnis

1. **Deteksi bentrok jadwal.** Dua reservasi pada lapangan dan tanggal yang sama dianggap bentrok jika:
   `startTime baru < endTime lama` **dan** `endTime baru > startTime lama`.
   Reservasi 18:00–19:00 dan 19:00–20:00 **tidak** bentrok (jam selesai = jam mulai berikutnya).
2. **Booking `CANCELLED` tidak dihitung sebagai slot terpakai** — hanya booking berstatus `BOOKED` yang diperiksa saat cek bentrok dan ketersediaan. Karena itu slot yang dibatalkan bisa dipesan lagi.
3. `endTime` harus lebih besar dari `startTime`; format jam `HH:mm`, format tanggal `YYYY-MM-DD`.
4. `totalPrice = pricePerHour × durasi (jam)`.
5. Lapangan berstatus `MAINTENANCE` tidak dapat dipesan.
6. Reservasi yang sudah `CANCELLED` tidak dapat dibatalkan lagi.
7. Reservasi `COMPLETED` tidak dapat dibatalkan.

## Ringkasan Status Code

| Kondisi                                   | Status Code       |
| ----------------------------------------- | ----------------- |
| Data berhasil diambil / dibatalkan        | `200 OK`          |
| Booking berhasil dibuat                   | `201 Created`     |
| Request body / query tidak valid          | `400 Bad Request` |
| Lapangan atau booking tidak ditemukan     | `404 Not Found`   |
| Jadwal bentrok / booking sudah dibatalkan | `409 Conflict`    |

Format response error yang dipakai:

```json
{ "statusCode": 404, "message": "Lapangan dengan id 99 tidak ditemukan" }
```

---

## Contoh Request dan Response

### 1. GET /fields

**Response `200 OK`**

```json
[
  {
    "id": 1,
    "name": "Lapangan Futsal A",
    "sportType": "futsal",
    "pricePerHour": 150000,
    "status": "ACTIVE"
  },
  {
    "id": 2,
    "name": "Lapangan Badminton 1",
    "sportType": "badminton",
    "pricePerHour": 60000,
    "status": "ACTIVE"
  },
  {
    "id": 3,
    "name": "Lapangan Basket Indoor",
    "sportType": "basket",
    "pricePerHour": 200000,
    "status": "MAINTENANCE"
  }
]
```

### 2. GET /fields/:id

`GET /fields/2` → **`200 OK`**

```json
{
  "id": 2,
  "name": "Lapangan Badminton 1",
  "sportType": "badminton",
  "pricePerHour": 60000,
  "status": "ACTIVE"
}
```

`GET /fields/99` → **`404 Not Found`**

```json
{ "statusCode": 404, "message": "Lapangan dengan id 99 tidak ditemukan" }
```

### 3. GET /fields/:id/availability?date=YYYY-MM-DD

`GET /fields/2/availability?date=2026-11-05` → **`200 OK`**

Sebelum ada booking:

```json
{
  "fieldId": 2,
  "date": "2026-11-05",
  "bookedSlots": [],
  "message": "Seluruh jam pada tanggal ini masih tersedia"
}
```

Setelah ada booking 18:00–19:00:

```json
{
  "fieldId": 2,
  "date": "2026-11-05",
  "bookedSlots": [{ "bookingId": 1, "startTime": "18:00", "endTime": "19:00" }]
}
```

Tanpa parameter `date` → **`400 Bad Request`**

```json
{
  "statusCode": 400,
  "message": "Query parameter 'date' wajib diisi dengan format YYYY-MM-DD"
}
```

### 4. POST /bookings

**Request**

```json
{
  "fieldId": 2,
  "date": "2026-11-05",
  "startTime": "18:00",
  "endTime": "19:00",
  "customerName": "Budi"
}
```

**a) Booking berhasil — `201 Created`**

```json
{
  "message": "Booking berhasil dibuat",
  "data": {
    "id": 1,
    "fieldId": 2,
    "customerName": "Budi",
    "date": "2026-11-05",
    "startTime": "18:00",
    "endTime": "19:00",
    "totalPrice": 60000,
    "status": "BOOKED"
  }
}
```

**b) Jadwal bentrok — `409 Conflict`** (kirim ulang request yang sama, atau jam yang beririsan, mis. 18:30–19:30)

```json
{
  "statusCode": 409,
  "message": "Jadwal bentrok: lapangan sudah dipesan pada 18:00-19:00 tanggal 2026-11-05"
}
```

**c) Lapangan tidak ditemukan — `404 Not Found`** (`fieldId: 99`)

```json
{ "statusCode": 404, "message": "Lapangan dengan id 99 tidak ditemukan" }
```

**d) Body tidak valid — `400 Bad Request`** (mis. `endTime` ≤ `startTime`)

```json
{ "statusCode": 400, "message": "endTime harus lebih besar dari startTime" }
```

### 5. GET /bookings/:id

`GET /bookings/1` → **`200 OK`**

```json
{
  "id": 1,
  "fieldId": 2,
  "customerName": "Budi",
  "date": "2026-11-05",
  "startTime": "18:00",
  "endTime": "19:00",
  "totalPrice": 60000,
  "status": "BOOKED"
}
```

`GET /bookings/99` → **`404 Not Found`**

```json
{ "statusCode": 404, "message": "Booking dengan id 99 tidak ditemukan" }
```

### 6. GET /users/:userId/bookings

`GET /users/1/bookings` → **`200 OK`**

```json
[
  {
    "id": 1,
    "fieldId": 2,
    "customerName": "Budi",
    "date": "2026-11-05",
    "startTime": "18:00",
    "endTime": "19:00",
    "totalPrice": 60000,
    "status": "BOOKED"
  }
]
```

Jika pengguna belum punya reservasi, response berupa array kosong `[]` dengan status `200 OK`.

### 7. PATCH /bookings/:id/cancel

`PATCH /bookings/1/cancel` → **`200 OK`**

```json
{
  "message": "Booking berhasil dibatalkan",
  "data": {
    "id": 1,
    "fieldId": 2,
    "customerName": "Budi",
    "date": "2026-11-05",
    "startTime": "18:00",
    "endTime": "19:00",
    "totalPrice": 60000,
    "status": "CANCELLED"
  }
}
```

Dibatalkan dua kali → **`409 Conflict`**

```json
{
  "statusCode": 409,
  "message": "Booking dengan id 1 sudah dibatalkan sebelumnya"
}
```

Booking tidak ada → **`404 Not Found`**

```json
{ "statusCode": 404, "message": "Booking dengan id 99 tidak ditemukan" }
```

---

## Skenario Pengujian Wajib

Urutan pengujian (jalankan berurutan di Postman):

| #   | Skenario                          | Request                                       | Hasil yang Diharapkan                         |
| --- | --------------------------------- | --------------------------------------------- | --------------------------------------------- |
| 1   | Daftar lapangan                   | `GET /fields`                                 | 200, daftar lapangan                          |
| 2   | Cek ketersediaan awal             | `GET /fields/2/availability?date=2026-11-05`  | 200, `bookedSlots` kosong                     |
| 3   | Booking berhasil                  | `POST /bookings` (18:00–19:00)                | 201, status `BOOKED`                          |
| 4   | Booking bentrok                   | `POST /bookings` (slot yang sama / beririsan) | 409                                           |
| 5   | Lapangan tidak ditemukan          | `POST /bookings` dengan `fieldId: 99`         | 404                                           |
| 6   | Booking tidak ditemukan           | `GET /bookings/99`                            | 404                                           |
| 7   | Cek ketersediaan setelah booking  | `GET /fields/2/availability?date=2026-11-05`  | 200, slot 18:00–19:00 muncul di `bookedSlots` |
| 8   | Batalkan booking                  | `PATCH /bookings/1/cancel`                    | 200, status `CANCELLED`                       |
| 9   | Cek ketersediaan setelah batal    | `GET /fields/2/availability?date=2026-11-05`  | 200, slot kembali tersedia                    |
| 10  | Booking ulang di slot yang sama   | `POST /bookings` (18:00–19:00)                | 201 (slot sudah bebas lagi)                   |
| 11  | Batalkan booking yang sudah batal | `PATCH /bookings/1/cancel`                    | 409                                           |

## Struktur Project

```
src/
├── app.module.ts
├── main.ts
├── app.controller.ts
├── app.service.ts
```
