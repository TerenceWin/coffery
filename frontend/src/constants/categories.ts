// Category values sent to the backend, which maps each one to a code prefix
// (e.g. Coffee -> C001, C002, ...) and generates the item's code.
export const CATEGORIES: { value: string; labelKey: string }[] = [
  { value: 'Coffee', labelKey: 'catCoffee' },
  { value: 'Special Coffee', labelKey: 'catSpecialCoffee' },
  { value: 'Drinks', labelKey: 'catDrinks' },
  { value: 'Bread', labelKey: 'catBread' },
  { value: 'Fries', labelKey: 'catFries' },
  { value: 'Dessert', labelKey: 'catDessert' },
  { value: 'Others', labelKey: 'catOthers' },
];
