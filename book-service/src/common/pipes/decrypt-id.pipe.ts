import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { decryptId } from '../utils/crypto.util';

@Injectable()
export class DecryptIdPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): number {
    let stringValue: string;
    if (typeof value === 'number' || Number.isNaN(value)) {
      throw new BadRequestException(
        'ID must be a valid encrypted string, received: ' + value,
      );
    } else {
      stringValue = String(value);
    }

    if (!stringValue || stringValue === '' || stringValue === 'undefined') {
      throw new BadRequestException('ID is required');
    }

    try {
      const decryptedId = decryptId(stringValue);
      return decryptedId;
    } catch (error) {
      throw new BadRequestException('Invalid encrypted ID: ' + error.message);
    }
  }
}
