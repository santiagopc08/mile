#include "engine/gameplay/inventory/InventorySystem.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    bool InventorySystem::addItem(Registry &registry, EntityID entity, const std::string &itemID, uint32_t amount)
    {
        auto *runtime = registry.GetComponent<InventoryRuntimeComponent>(entity);
        if (!runtime) runtime = &registry.AddComponent<InventoryRuntimeComponent>(entity);

        runtime->items[itemID] += amount;
        LOG_INFO("[InventorySystem] Added x{} of item '{}' to entity #{}.", amount, itemID, entity);
        return true;
    }

    bool InventorySystem::removeItem(Registry &registry, EntityID entity, const std::string &itemID, uint32_t amount)
    {
        auto *runtime = registry.GetComponent<InventoryRuntimeComponent>(entity);
        if (runtime && contains(registry, entity, itemID))
        {
            if (runtime->items[itemID] <= amount)
            {
                runtime->items.erase(itemID);
            }
            else
            {
                runtime->items[itemID] -= amount;
            }
            LOG_INFO("[InventorySystem] Removed x{} of item '{}' from entity #{}.", amount, itemID, entity);
            return true;
        }
        return false;
    }

    bool InventorySystem::contains(Registry &registry, EntityID entity, const std::string &itemID) const
    {
        auto *runtime = registry.GetComponent<InventoryRuntimeComponent>(entity);
        return runtime ? (runtime->items.contains(itemID) && runtime->items.at(itemID) > 0) : false;
    }

    void InventorySystem::clear(Registry &registry, EntityID entity)
    {
        auto *runtime = registry.GetComponent<InventoryRuntimeComponent>(entity);
        if (runtime)
        {
            runtime->items.clear();
            LOG_INFO("[InventorySystem] Cleared inventory of entity #{}.", entity);
        }
    }

    uint32_t InventorySystem::quantity(Registry &registry, EntityID entity, const std::string &itemID) const
    {
        auto *runtime = registry.GetComponent<InventoryRuntimeComponent>(entity);
        if (runtime && runtime->items.contains(itemID))
        {
            return runtime->items.at(itemID);
        }
        return 0;
    }
}
