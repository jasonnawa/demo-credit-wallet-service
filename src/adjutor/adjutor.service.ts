import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { KarmaBlacklistResponseDto, KarmaOptions } from './dto/karma-response.dto';

@Injectable()
export class AdjutorService {
    private readonly BASE_URL;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService
    ) {
        this.BASE_URL = this.configService.get<string>('ADJUTOR_BASE_API_URL');
    }

    async isBlacklisted(email: string): Promise<boolean> {
        console.log(`${ this.BASE_URL}verification/karma/${email}`)
        try {
            const response = await this.httpService.axiosRef.get<KarmaBlacklistResponseDto>(
                `${this.BASE_URL}verification/karma/${email}`, //verification/karma/:identity
            );

            let karma = response.data.data.karma_type.karma
            return karma !== KarmaOptions.Others; //TODO: get all types
        } catch (error) {
            console.error('Adjutor API error:', error?.response?.data || error.message);
            throw new InternalServerErrorException('Failed to contact Adjutor service');
        }
    }
}
