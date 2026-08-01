#include "engine/scene/Registry.hpp"
#include "engine/core/Logger.hpp"
#include <algorithm>

namespace platform
{
    Registry::Registry() = default;
    Registry::~Registry() = default;

    EntityID Registry::CreateEntity()
    {
        EntityID id = m_nextEntityID++;
        m_aliveEntities.push_back(id);
        m_entityStates[id] = EntityState::Alive;

        // Default components attached to every new entity
        AddComponent<NameComponent>(id);
        AddComponent<TagComponent>(id);
        AddComponent<ActiveComponent>(id);

        return id;
    }

    EntityID Registry::CreateEntity(const std::string &name)
    {
        EntityID id = CreateEntity();
        if (auto *nameComp = GetComponent<NameComponent>(id))
        {
            nameComp->Name = name;
        }
        return id;
    }

    void Registry::DestroyEntity(EntityID entity)
    {
        auto it = m_entityStates.find(entity);
        if (it != m_entityStates.end() && it->second == EntityState::Alive)
        {
            it->second = EntityState::PendingDestroy;
            m_pendingDestroy.push_back(entity);
        }
    }

    void Registry::FlushDestroyedEntities()
    {
        if (m_pendingDestroy.empty())
        {
            return;
        }

        for (EntityID entity : m_pendingDestroy)
        {
            // Remove from component pools
            for (auto &[typeIdx, pool] : m_pools)
            {
                if (pool)
                {
                    pool->Remove(entity);
                }
            }

            // Remove from alive entities list
            auto aliveIt = std::find(m_aliveEntities.begin(), m_aliveEntities.end(), entity);
            if (aliveIt != m_aliveEntities.end())
            {
                m_aliveEntities.erase(aliveIt);
            }

            m_entityStates[entity] = EntityState::Destroyed;
        }

        m_pendingDestroy.clear();
    }

    bool Registry::IsAlive(EntityID entity) const
    {
        auto it = m_entityStates.find(entity);
        return it != m_entityStates.end() && (it->second == EntityState::Alive || it->second == EntityState::PendingDestroy);
    }

    size_t Registry::EntityCount() const
    {
        return m_aliveEntities.size();
    }

    void Registry::Clear()
    {
        for (auto &[typeIdx, pool] : m_pools)
        {
            if (pool)
            {
                pool->Clear();
            }
        }

        m_aliveEntities.clear();
        m_pendingDestroy.clear();
        m_entityStates.clear();
    }

    void Registry::Reserve(size_t capacity)
    {
        m_aliveEntities.reserve(capacity);
        m_pendingDestroy.reserve(capacity);
    }
}
