import {
  IsString,
  IsNotEmpty,
  Matches,
  IsEmail,
  Length,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

const constraints = `1. Must be at least 8 characters long.
2. Must include uppercase and lowercase letters.
3. Must include numbers.
4. Must include special characters.`;

const capitalize = (value: string) => {
  return value[0].toUpperCase() + value.slice(1);
};

export class CreateUserDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Length(5, 15)
  @Transform(({ value }) => (value as string).toLowerCase())
  username: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => capitalize(value))
  @Length(3, 20)
  firstname: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => capitalize(value))
  @Length(3, 20)
  lastname: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: constraints,
  })
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message: `Password is too weak. It must include uppercase and lowercase letters, numbers, and special characters.`,
    },
  )
  password: string;
}
