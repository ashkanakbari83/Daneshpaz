import RecipeCard from './RecipeCard';
import styles from './RecipeGrid.module.css';

/** items: [{ recipe, cost }] */
export default function RecipeGrid({ items }) {
  return (
    <ul className={styles.grid}>
      {items.map(({ recipe, cost }) => (
        <li key={recipe.id}>
          <RecipeCard recipe={recipe} cost={cost} />
        </li>
      ))}
    </ul>
  );
}
