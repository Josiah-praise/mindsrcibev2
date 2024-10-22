import { ApiProperty, OmitType } from '@nestjs/swagger';
import { UserResponseDto } from 'src/users/dto/userResponse.dto';

export class SignupReturnDto {
  @ApiProperty({
    description: 'The JWT access token for the user',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty()
  user: UserResponseDto;
}
