import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { CustomerProfile } from './entities/customer-profile.entity';
import { CustomerProfileRepository } from './repositories/customer-profile.repository';

describe('UsersService', () => {
  let service: UsersService;
  let repository: CustomerProfileRepository;

  const mockRepository = {
    findByUserId: jest.fn(),
    findByIdWithUser: jest.fn(),
    createCustomerProfile: jest.fn(),
    updateCustomerProfile: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(CustomerProfile),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<CustomerProfileRepository>(
      getRepositoryToken(CustomerProfile),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
