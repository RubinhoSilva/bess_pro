export interface UpdateAreaLayoutCommand {
  areaId: string;
  userId: string;
  moduleLayout: Record<string, any>;
}