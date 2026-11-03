import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // --- LAPANGAN ---
  @Get("fields")
  getAllFields() {
    return this.appService.getAllFields();
  }

  @Get("fields/:id")
  getFieldById(@Param("id") id: string) {
    return this.appService.getFieldById(Number(id));
  }

  @Get("fields/:id/availability")
  getAvailability(@Param("id") id: string, @Query("date") date: string) {
    return this.appService.getAvailability(Number(id), date);
  }

  // --- RESERVASI ---
  @Post("bookings")
  @HttpCode(HttpStatus.CREATED)
  createBooking(@Body() body: any) {
    return this.appService.createBooking(body);
  }

  @Get("bookings/:id")
  getBookingById(@Param("id") id: string) {
    return this.appService.getBookingById(Number(id));
  }

  @Get("users/:userId/bookings")
  getUserBookings(@Param("userId") userId: string) {
    return this.appService.getUserBookings(Number(userId));
  }

  @Patch("bookings/:id/cancel")
  cancelBooking(@Param("id") id: string) {
    return this.appService.cancelBooking(Number(id));
  }
}
