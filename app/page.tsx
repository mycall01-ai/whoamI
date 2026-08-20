import { RestaurantExplorer } from "@/components/restaurant-explorer";
import { loadRestaurants } from "@/lib/restaurants.server";

export default function Home() {
  const restaurants = loadRestaurants();

  return (
    <div className="flex flex-1 flex-col items-center bg-background">
      <RestaurantExplorer restaurants={restaurants} />
    </div>
  );
}
