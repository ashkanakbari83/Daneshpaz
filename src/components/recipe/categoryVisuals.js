import { Soup, GraduationCap, Wallet, Zap, Leaf, Coffee, UtensilsCrossed, Moon, Cake, Salad, ChefHat } from 'lucide-react';

export const CATEGORY_VISUALS = {
  iranian: { icon: Soup, tone: 'green' },
  student: { icon: GraduationCap, tone: 'accent' },
  budget: { icon: Wallet, tone: 'green' },
  quick: { icon: Zap, tone: 'accent' },
  vegetarian: { icon: Leaf, tone: 'green' },
  breakfast: { icon: Coffee, tone: 'terracotta' },
  lunch: { icon: UtensilsCrossed, tone: 'accent' },
  dinner: { icon: Moon, tone: 'green' },
  dessert: { icon: Cake, tone: 'terracotta' },
  salad: { icon: Salad, tone: 'green' },
};

export const DEFAULT_VISUAL = { icon: ChefHat, tone: 'green' };

export const visualFor = (recipe) => CATEGORY_VISUALS[recipe.categorySlugs[0]] ?? DEFAULT_VISUAL;
