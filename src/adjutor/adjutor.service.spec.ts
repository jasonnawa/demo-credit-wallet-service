import { Test, TestingModule } from '@nestjs/testing';
import { AdjutorService } from './adjutor.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { KarmaOptions } from './dto/karma-response.dto';
import { AxiosInstance } from 'axios';

describe('AdjutorService', () => {
  let service: AdjutorService;
  let httpServiceMock: Partial<HttpService>;
  let configServiceMock: Partial<ConfigService>;

  const BASE_URL = 'https://fake-adjutor.api/';

  beforeEach(async () => {
    httpServiceMock = {
      axiosRef: {
        get: jest.fn(),
      } as unknown as AxiosInstance,
    };

    configServiceMock = {
      get: jest.fn().mockReturnValue(BASE_URL),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdjutorService,
        { provide: HttpService, useValue: httpServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<AdjutorService>(AdjutorService);
  });

  it('should return false if karma is "Others"', async () => {
    (httpServiceMock.axiosRef?.get as jest.Mock).mockResolvedValueOnce({
      data: {
        data: {
          karma_type: { karma: KarmaOptions.Others }
        }
      }
    });

    const result = await service.isBlacklisted('jane@example.com');
    expect(result).toBe(false);
    expect(httpServiceMock.axiosRef?.get).toHaveBeenCalledWith(`${BASE_URL}verification/karma/jane@example.com`);
  });

  it('should return true if karma is not "Others"', async () => {
    (httpServiceMock.axiosRef?.get as jest.Mock).mockResolvedValueOnce({
      data: {
        data: {
          karma_type: { karma: 'OtherStatus' } 
        }
      }
    });

    const result = await service.isBlacklisted('john@example.com');
    expect(result).toBe(true);
    expect(httpServiceMock.axiosRef?.get).toHaveBeenCalledWith(`${BASE_URL}verification/karma/john@example.com`);
  });

  it('should throw InternalServerErrorException on API failure', async () => {
    (httpServiceMock.axiosRef?.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await expect(service.isBlacklisted('error@example.com')).rejects.toThrow(InternalServerErrorException);
    await expect(service.isBlacklisted('error@example.com')).rejects.toThrow('Failed to contact Adjutor service');
  });
});
