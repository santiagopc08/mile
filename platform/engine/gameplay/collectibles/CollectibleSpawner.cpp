#include "engine/gameplay/collectibles/CollectibleSpawner.hpp"
#include "engine/gameplay/collectibles/CollectibleComponent.hpp"
#include "engine/graphics/components/ShapeComponent.hpp"
#include "engine/graphics/components/RenderLayerComponent.hpp"
#include "engine/graphics/components/VisibilityComponent.hpp"

namespace platform
{
    CollectibleSpawner::CollectibleSpawner() = default;

    void CollectibleSpawner::SpawnCollectiblesAlongTerrain(Registry &registry, const TerrainManager &terrainManager, float startX, float endX)
    {
        float coinSpacing = 80.0f;
        float fuelSpacing = 400.0f;

        for (float x = startX; x <= endX; x += coinSpacing)
        {
            float y = terrainManager.GetHeight(x) - 30.0f; // Floating above terrain

            EntityID coinEntity = registry.CreateEntity("Coin");
            if (auto *transform = registry.GetComponent<TransformComponent>(coinEntity))
            {
                transform->SetPosition({x, y});
                transform->SetScale({16.0f, 16.0f});
            }

            auto &collectible = registry.AddComponent<CollectibleComponent>(coinEntity);
            collectible.Type = CollectibleType::Coin;
            collectible.Value = 1.0f;
            collectible.Radius = 20.0f;

            auto &shape = registry.AddComponent<ShapeComponent>(coinEntity);
            shape.Type = ShapeType::Circle;
            shape.Size = {16.0f, 16.0f};
            shape.Color = {0.95f, 0.8f, 0.1f, 1.0f}; // Yellow Gold Coins

            registry.AddComponent<RenderLayerComponent>(coinEntity);
            registry.AddComponent<VisibilityComponent>(coinEntity);
        }

        // Spawn Fuel canisters at wider intervals
        for (float x = startX + 200.0f; x <= endX; x += fuelSpacing)
        {
            float y = terrainManager.GetHeight(x) - 35.0f;

            EntityID fuelEntity = registry.CreateEntity("FuelCanister");
            if (auto *transform = registry.GetComponent<TransformComponent>(fuelEntity))
            {
                transform->SetPosition({x, y});
                transform->SetScale({24.0f, 32.0f});
            }

            auto &collectible = registry.AddComponent<CollectibleComponent>(fuelEntity);
            collectible.Type = CollectibleType::Fuel;
            collectible.Value = 40.0f; // Refills 40% fuel
            collectible.Radius = 30.0f;

            auto &shape = registry.AddComponent<ShapeComponent>(fuelEntity);
            shape.Type = ShapeType::Rectangle;
            shape.Size = {24.0f, 32.0f};
            shape.Color = {0.85f, 0.15f, 0.15f, 1.0f}; // Red Fuel Canister

            registry.AddComponent<RenderLayerComponent>(fuelEntity);
            registry.AddComponent<VisibilityComponent>(fuelEntity);
        }
    }
}
