import { RestaurantExplorer } from "@/components/restaurant-explorer";
import { loadDataUpdatedAt, loadRestaurants } from "@/lib/restaurants.server";

export default function Home() {
  const restaurants = loadRestaurants();
  const updatedAt = loadDataUpdatedAt();

  return (
    <div className="flex flex-1 flex-col items-center bg-background">
      <RestaurantExplorer restaurants={restaurants} updatedAt={updatedAt} />
    </div>
  );
}
