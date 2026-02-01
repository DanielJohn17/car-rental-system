import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking } from './entities/booking.entity';
import { Vehicle } from '../vehicle/entities/vehicle.entity';
import { Location } from '../locations/entities/location.entity';

describe('BookingsController', () => {
  let controller: BookingsController;
  let service: BookingsService;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        BookingsService,
        {
          provide: getRepositoryToken(Booking),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Vehicle),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Location),
          useValue: mockRepository,
        },
      ],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
    service = module.get<BookingsService>(BookingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });
});
