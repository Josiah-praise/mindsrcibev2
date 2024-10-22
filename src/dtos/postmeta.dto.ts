import { IsString } from 'class-validator';
import { Transform } from 'class-transformer';

function normalizeString(category: string) {
  const temp = category.toLowerCase();
  return category[0].toUpperCase() + temp.slice(1);
}

export class CreateCategoryDTO {
  @IsString()
  @Transform(({ value }) => normalizeString(value))
  category: string;
}

export class CreateTagDTO {
  @IsString()
  @Transform(({ value }) => normalizeString(value))
  tag: string;
}
