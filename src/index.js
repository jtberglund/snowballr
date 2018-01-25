import * as Validation from 'folktale/validation';
import * as curry from 'lodash/fp/curry';
import * as filter from 'lodash/fp/filter';
import * as keys from 'lodash/fp/keys';
import * as map from 'lodash/fp/map';
import * as mapValuesNoIndex from 'lodash/fp/mapValues';
import * as pipe from 'lodash/fp/pipe';

const mapValues = mapValuesNoIndex.convert({ cap: false });

// type Predicate = (args?: any) => boolean;
// type ValidationRule = [Predicate, string][];
// export type ValidationRules<T> = { [P in keyof T]: ValidationRule };
// export type ValidationResult<T> = { [P in keyof T]: Validation[] };
// export type Errors<T> = { [P in keyof T]: string[] };

const makePredicate = ([predFn, msg]) => a => (predFn(a) ? Validation.of(a) : Validation.of(msg).swap());

const makePredicates = map(makePredicate);

const runPredicates = ([input, validations]) => map(predFn => predFn(input), makePredicates(validations));

// interface ValidateFn {
//     <R>(validationRules: ValidationRules<R>, input: Partial<R>): ValidationResult<R>;
//     <R>(validationRules: ValidationRules<R>): (input: Partial<R>) => ValidationResult<R>;
// }

/**
 * Validates the given input with the validation rules.
 * This will return a map of the input keys to a list of Validation objects
 */
export const validate = curry((validationRules, input) =>
    mapValues((formInput, key) => runPredicates([formInput, validationRules[key]]), input)
);

const toSuccess = val => (Validation.Success.hasInstance(val) ? val : val.swap());

const getError = pipe(toSuccess, val => val.unsafeGet());

/**
 * Filter out Successes and get the value from Errors
 */
const extractErrors = pipe(filter(Validation.Failure.hasInstance), map(getError));

/**
 * Filter out Success objects from a ValidationResult (returned from {@link validate}).
 * This can be used to display the necessary errors in your render function
 */
export const getErrors = result => {
    return keys(result).reduce(
        (acc, key) => ({
            ...acc,
            [key]: extractErrors(result[key])
        }),
        {}
    );
};
