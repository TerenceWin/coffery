export interface MenuItem {
  id?: number;
  item: string;
  code: string;
  category: string;
  cost: number;
  available: boolean;
  imagePath?: string
}
