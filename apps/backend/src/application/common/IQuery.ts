export interface IQuery<TOutput> {
  execute(): Promise<TOutput>;
}
