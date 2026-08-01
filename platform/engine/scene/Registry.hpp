#ifndef PLATFORM_ENGINE_SCENE_REGISTRY_HPP
#define PLATFORM_ENGINE_SCENE_REGISTRY_HPP

#include "engine/scene/Entity.hpp"
#include "engine/scene/SparseSet.hpp"
#include "engine/scene/View.hpp"
#include "engine/scene/components/Components.hpp"
#include <unordered_map>
#include <vector>
#include <memory>
#include <typeindex>

namespace platform
{
    class Registry
    {
    public:
        Registry();
        ~Registry();

        EntityID CreateEntity();
        EntityID CreateEntity(const std::string &name);
        void DestroyEntity(EntityID entity);
        void FlushDestroyedEntities();

        [[nodiscard]] bool IsAlive(EntityID entity) const;
        [[nodiscard]] size_t EntityCount() const;
        [[nodiscard]] const std::vector<EntityID> &GetAliveEntities() const { return m_aliveEntities; }
        void Clear();
        void Reserve(size_t capacity);

        template <typename T, typename... Args>
        T &AddComponent(EntityID entity, Args &&...args)
        {
            assert(IsAlive(entity) && "Cannot add component to dead entity.");
            auto &pool = GetOrCreatePool<T>();
            return pool.Add(entity, std::forward<Args>(args)...);
        }

        template <typename T>
        void RemoveComponent(EntityID entity)
        {
            auto *pool = GetPool<T>();
            if (pool)
            {
                pool->Remove(entity);
            }
        }

        template <typename T>
        T *GetComponent(EntityID entity)
        {
            auto *pool = GetPool<T>();
            return pool ? pool->Get(entity) : nullptr;
        }

        template <typename T>
        const T *GetComponent(EntityID entity) const
        {
            auto *pool = GetPool<T>();
            return pool ? pool->Get(entity) : nullptr;
        }

        template <typename T>
        bool HasComponent(EntityID entity) const
        {
            auto *pool = GetPool<T>();
            return pool ? pool->Has(entity) : false;
        }

        template <typename... ComponentTypes>
        View<ComponentTypes...> GetView()
        {
            std::vector<EntityID> matchingEntities;

            for (EntityID entity : m_aliveEntities)
            {
                if ((HasComponent<ComponentTypes>(entity) && ...))
                {
                    matchingEntities.push_back(entity);
                }
            }

            return View<ComponentTypes...>(*this, std::move(matchingEntities));
        }

    private:
        template <typename T>
        SparseSet<T> &GetOrCreatePool()
        {
            std::type_index typeIdx(typeid(T));
            auto it = m_pools.find(typeIdx);
            if (it == m_pools.end())
            {
                auto pool = std::make_unique<SparseSet<T>>();
                auto *raw = pool.get();
                m_pools[typeIdx] = std::move(pool);
                return *raw;
            }
            return *static_cast<SparseSet<T> *>(it->second.get());
        }

        template <typename T>
        SparseSet<T> *GetPool()
        {
            std::type_index typeIdx(typeid(T));
            auto it = m_pools.find(typeIdx);
            if (it != m_pools.end())
            {
                return static_cast<SparseSet<T> *>(it->second.get());
            }
            return nullptr;
        }

        template <typename T>
        const SparseSet<T> *GetPool() const
        {
            std::type_index typeIdx(typeid(T));
            auto it = m_pools.find(typeIdx);
            if (it != m_pools.end())
            {
                return static_cast<const SparseSet<T> *>(it->second.get());
            }
            return nullptr;
        }

        EntityID m_nextEntityID{1};
        std::vector<EntityID> m_aliveEntities;
        std::vector<EntityID> m_pendingDestroy;
        std::unordered_map<EntityID, EntityState> m_entityStates;
        std::unordered_map<std::type_index, std::unique_ptr<ISparseSet>> m_pools;
    };

    template <typename... ComponentTypes>
    void View<ComponentTypes...>::Each(const std::function<void(EntityID, ComponentTypes &...)> &func)
    {
        if (!func || !m_registry)
        {
            return;
        }

        for (EntityID entity : m_entities)
        {
            func(entity, (*m_registry->GetComponent<ComponentTypes>(entity))...);
        }
    }
}

#endif // PLATFORM_ENGINE_SCENE_REGISTRY_HPP
