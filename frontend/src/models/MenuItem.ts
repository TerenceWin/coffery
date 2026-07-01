export interface MenuItem {
  id?: number; 
  item: string;
  code: string;
  cost: number;
  available: boolean;
  imagePath?: string
}
