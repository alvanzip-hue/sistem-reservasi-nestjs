import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';

export interface Field {
  id: number;
  name: string;
  sportType: string;
  pricePerHour: number;
  status: string;
}

export interface Booking {
  id: number;
  fieldId: number;
  date: string; // Format: YYYY-MM-DD
  startTime: string; // Format: HH:mm
  endTime: string; // Format: HH:mm
  customerName: string;
  userId?: number;
  status: 'BOOKED' | 'CANCELLED' | 'COMPLETED';
}

@Injectable()
export class AppService {
  // Data dummy Lapangan
  private fields: Field[] = [
    { id: 1, name: 'Lapangan Futsal A', sportType: 'Futsal', pricePerHour: 150000, status: 'AVAILABLE' },
    { id: 2, name: 'Lapangan Bulutangkis B', sportType: 'Badminton', pricePerHour: 80000, status: 'AVAILABLE' },
    { id: 3, name: 'Lapangan Basket C', sportType: 'Basketball', pricePerHour: 120000, status: 'AVAILABLE' },
  ];

  // Data dummy Reservasi (Array In-Memory)
  private bookings: Booking[] = [
    {
      id: 1,
      fieldId: 2,
      date: '2026-11-05',
      startTime: '16:00',
      endTime: '17:00',
      customerName: 'Budi',
      userId: 101,
      status: 'BOOKED',
    },
  ];

  private nextBookingId = 2;

  // 1. Data Lapangan
  getAllFields(): Field[] {
    return this.fields;
  }

  getFieldById(id: number): Field {
    const field = this.fields.find((f) => f.id === id);
    if (!field) {
      throw new NotFoundException(`Lapangan dengan ID ${id} tidak ditemukan.`);
    }
    return field;
  }

  // 2. Ketersediaan Slot
  getAvailability(fieldId: number, date: string) {
    this.getFieldById(fieldId); // Validasi lapangan ada

    // Ambil reservasi aktif (hanya status BOOKED)
    const activeBookings = this.bookings.filter(
      (b) => b.fieldId === fieldId && b.date === date && b.status === 'BOOKED'
    );

    return {
      fieldId,
      date,
      bookedSlots: activeBookings.map((b) => ({
        startTime: b.startTime,
        endTime: b.endTime,
      })),
    };
  }

  // 3. Reservasi (POST /bookings)
  createBooking(body: any): Booking {
    const { fieldId, date, startTime, endTime, customerName, userId } = body;

    // Validasi Lapangan
    this.getFieldById(Number(fieldId));

    // Cek bentrok jam (Overlap Check)
    // Syarat bentrok: (startA < endB) DAN (endA > startB)
    const isOverlapping = this.bookings.some((b) => {
      if (b.fieldId === Number(fieldId) && b.date === date && b.status === 'BOOKED') {
        return startTime < b.endTime && endTime > b.startTime;
      }
      return false;
    });

    if (isOverlapping) {
      throw new ConflictException('Jadwal bentrok! Slot waktu sudah dipesan pengguna lain.');
    }

    const newBooking: Booking = {
      id: this.nextBookingId++,
      fieldId: Number(fieldId),
      date,
      startTime,
      endTime,
      customerName,
      userId: userId ? Number(userId) : 101, // default userId jika tidak dikirim
      status: 'BOOKED',
    };

    this.bookings.push(newBooking);
    return newBooking;
  }

  // 4. Detail Booking & Booking per User
  getBookingById(id: number): Booking {
    const booking = this.bookings.find((b) => b.id === id);
    if (!booking) {
      throw new NotFoundException(`Reservasi dengan ID ${id} tidak ditemukan.`);
    }
    return booking;
  }

  getUserBookings(userId: number): Booking[] {
    return this.bookings.filter((b) => b.userId === userId);
  }

  // 5. Pembatalan Booking (PATCH /bookings/:id/cancel)
  cancelBooking(id: number): Booking {
    const booking = this.getBookingById(id);

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Reservasi ini sudah dibatalkan sebelumnya.');
    }

    booking.status = 'CANCELLED';
    return booking;
  }
}