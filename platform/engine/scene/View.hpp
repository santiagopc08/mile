#ifndef PLATFORM_ENGINE_SCENE_VIEW_HPP
#define PLATFORM_ENGINE_SCENE_VIEW_HPP

#include "engine/scene/Entity.hpp"
#include "engine/scene/SparseSet.hpp"
#include <vector>
#include <tuple>
#include <functional>

namespace platform
{
    class Registry;

    template <typename... ComponentTypes>
    class View
    {
    public:
        View(Registry &registry, std::vector<EntityID> matchingEntities)
            : m_registry(&registry), m_entities(std::move(matchingEntities)) {}

        class Iterator
        {
        public:
            Iterator(const std::vector<EntityID> &entities, size_t index)
                : m_entities(&entities), m_index(index) {}

            EntityID operator*() const { return (*m_entities)[m_index]; }
            Iterator &operator++() { ++m_index; return *this; }
            bool operator!=(const Iterator &other) const { return m_index != other.m_index; }

        private:
            const std::vector<EntityID> *m_entities;
            size_t m_index;
        };

        Iterator begin() const { return Iterator(m_entities, 0); }
        Iterator end() const { return Iterator(m_entities, m_entities.size()); }

        [[nodiscard]] size_t Size() const { return m_entities.size(); }
        [[nodiscard]] bool Empty() const { return m_entities.empty(); }

        void Each(const std::function<void(EntityID, ComponentTypes &...)> &func);

    private:
        Registry *m_registry;
        std::vector<EntityID> m_entities;
    };
}

#endif // PLATFORM_ENGINE_SCENE_VIEW_HPP
