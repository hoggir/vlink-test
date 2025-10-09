import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { decryptId } from '../utils/crypto.util';

@Injectable()
export class DecryptQueryIdPipe implements PipeTransform {
  constructor(private readonly fieldName: string = 'userId') {}

  transform(value: any, metadata: ArgumentMetadata): any {
    if (!value) {
      return value;
    }

    if (typeof value === 'object' && value[this.fieldName]) {
      try {
        const decryptedId = decryptId(value[this.fieldName]);
        return {
          ...value,
          [this.fieldName]: decryptedId,
        };
      } catch (error) {
        throw new BadRequestException(`Invalid encrypted ${this.fieldName}`);
      }
    }

    return value;
  }
}
