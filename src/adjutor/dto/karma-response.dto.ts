export enum KarmaOptions{
    Others = 'Others'
}

export class KarmaTypeDto {
  karma: KarmaOptions; //TODO: get all karma types 
}

export class KarmaIdentityTypeDto {
  identity_type: string;
}

export class ReportingEntityDto {
  name: string;
  email: string;
}

export class KarmaDataDto {
  karma_identity: string;
  amount_in_contention: string;
  reason: string | null;
  default_date: string;
  karma_type: KarmaTypeDto;
  karma_identity_type: KarmaIdentityTypeDto;
  reporting_entity: ReportingEntityDto;
}

export class KarmaMetaDto {
  cost: number;
  balance: number;
}

export class KarmaBlacklistResponseDto {
  status: string;
  message: string;
  data: KarmaDataDto;
  meta: KarmaMetaDto;
}
