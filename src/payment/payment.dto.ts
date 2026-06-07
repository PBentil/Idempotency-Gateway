import {
    IsNumber,
    IsString,
    IsNotEmpty,
    IsPositive,
    Max,
    IsIn,
    registerDecorator,
    ValidationOptions,
} from 'class-validator';

const SUPPORTED_CURRENCIES = ['GHS', 'USD', 'EUR', 'GBP', 'NGN'];

function IsMaxTwoDecimals(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'isMaxTwoDecimals',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any) {
                    if (typeof value !== 'number') return false;
                    const decimalPart = value.toString().split('.')[1];
                    return !decimalPart || decimalPart.length <= 2;
                },
            },
        });
    };
}

export class ProcessPaymentDto {
    @IsNumber({}, { message: 'Amount must be a number' })
    @IsPositive({ message: 'Amount must be a positive number' })
    @IsMaxTwoDecimals({ message: 'Amount cannot have more than 2 decimal places' })
    @Max(1000000, { message: 'Amount cannot exceed 1,000,000' })
    amount: number;

    @IsString({ message: 'Currency must be a string' })
    @IsNotEmpty({ message: 'Currency is required' })
    @IsIn(SUPPORTED_CURRENCIES, {
        message: `Currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`,
    })
    currency: string;
}