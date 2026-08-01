#ifndef PLATFORM_ENGINE_SCENE_SPARSE_SET_HPP
#define PLATFORM_ENGINE_SCENE_SPARSE_SET_HPP

#include "engine/scene/Entity.hpp"
#include <vector>
#include <unordered_map>
#include <cassert>

namespace platform
{
    class ISparseSet
    {
    public:
        virtual ~ISparseSet() = default;
        virtual bool Has(EntityID entity) const = 0;
        virtual void Remove(EntityID entity) = 0;
        virtual void Clear() = 0;
        virtual size_t Size() const = 0;
    };

    template <typename T>
    class SparseSet : public ISparseSet
    {
    public:
        SparseSet() = default;
        ~SparseSet() override = default;

        bool Has(EntityID entity) const override
        {
            return m_sparse.find(entity) != m_sparse.end();
        }

        template <typename... Args>
        T &Add(EntityID entity, Args &&...args)
        {
            assert(!Has(entity) && "Component already exists on entity.");

            size_t index = m_denseComponents.size();
            m_sparse[entity] = index;
            m_denseEntities.push_back(entity);
            m_denseComponents.emplace_back(std::forward<Args>(args)...);

            return m_denseComponents.back();
        }

        void Remove(EntityID entity) override
        {
            auto it = m_sparse.find(entity);
            if (it == m_sparse.end())
            {
                return;
            }

            size_t removedIndex = it->second;
            size_t lastIndex = m_denseComponents.size() - 1;
            EntityID lastEntity = m_denseEntities.back();

            if (removedIndex != lastIndex)
            {
                m_denseComponents[removedIndex] = std::move(m_denseComponents[lastIndex]);
                m_denseEntities[removedIndex] = lastEntity;
                m_sparse[lastEntity] = removedIndex;
            }

            m_denseComponents.pop_back();
            m_denseEntities.pop_back();
            m_sparse.erase(it);
        }

        T *Get(EntityID entity)
        {
            auto it = m_sparse.find(entity);
            if (it != m_sparse.end())
            {
                return &m_denseComponents[it->second];
            }
            return nullptr;
        }

        const T *Get(EntityID entity) const
        {
            auto it = m_sparse.find(entity);
            if (it != m_sparse.end())
            {
                return &m_denseComponents[it->second];
            }
            return nullptr;
        }

        void Clear() override
        {
            m_denseComponents.clear();
            m_denseEntities.clear();
            m_sparse.clear();
        }

        size_t Size() const override
        {
            return m_denseComponents.size();
        }

        const std::vector<EntityID> &GetEntities() const { return m_denseEntities; }
        const std::vector<T> &GetComponents() const { return m_denseComponents; }
        std::vector<T> &GetComponents() { return m_denseComponents; }

    private:
        std::vector<T> m_denseComponents;
        std::vector<EntityID> m_denseEntities;
        std::unordered_map<EntityID, size_t> m_sparse;
    };
}

#endif // PLATFORM_ENGINE_SCENE_SPARSE_SET_HPP
