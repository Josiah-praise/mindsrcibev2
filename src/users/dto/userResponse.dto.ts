import { ApiProperty, OmitType } from '@nestjs/swagger';
import { User } from 'src/entities/user';

export class UserResponseDto extends OmitType(User, ['password'] as const) {}
export class PaginationMetaDataDto {
  @ApiProperty()
  total: number;
  @ApiProperty()
  page: number;
  @ApiProperty()
  currPageTotal: number;
  @ApiProperty()
  limit: number;
  @ApiProperty()
  totalPages: number;
  @ApiProperty()
  hasNextPage: boolean;
  @ApiProperty()
  hasPreviousPage: boolean;
}
export class PaginatedUsersDto {
  @ApiProperty({
    type: UserResponseDto,
    isArray: true,
  })
  data: UserResponseDto[];
  @ApiProperty()
  meta: PaginationMetaDataDto;
}
