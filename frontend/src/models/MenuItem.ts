export interface MenuItem {
    id?: number; // During the checkout for the customer, ID is lost (Not needed)
  item: string;
  code: string;
  cost: number;
  available: boolean;
  imagePath: string
}
