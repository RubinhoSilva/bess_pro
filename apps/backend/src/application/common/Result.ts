export class Result<T> {
  private constructor(
    public readonly isSuccess: boolean,
    public readonly value?: T,
    public readonly error?: string
  ) {}

  static success<T>(value: T): Result<T> {
    return new Result(true, value);
  }

  static failure<T>(error: string): Result<T> {
    return new Result<T>(false, undefined as T, error);
  }

  static combine(results: Result<any>[]): Result<void> {
    const failures = results.filter(r => !r.isSuccess);
    if (failures.length > 0) {
      return Result.failure(failures.map(f => f.error).join(', '));
    }
    return Result.success(undefined);
  }
}