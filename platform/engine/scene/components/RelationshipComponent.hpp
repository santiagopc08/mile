#ifndef PLATFORM_ENGINE_SCENE_COMPONENTS_RELATIONSHIP_COMPONENT_HPP
#define PLATFORM_ENGINE_SCENE_COMPONENTS_RELATIONSHIP_COMPONENT_HPP

#include "engine/scene/Entity.hpp"
#include <vector>

namespace platform
{
    struct RelationshipComponent
    {
        EntityID Parent{kNullEntity};
        EntityID FirstChild{kNullEntity};
        EntityID NextSibling{kNullEntity};
        EntityID PrevSibling{kNullEntity};
        size_t ChildrenCount{0};

        [[nodiscard]] bool HasParent() const { return Parent != kNullEntity; }
        [[nodiscard]] bool HasChildren() const { return ChildrenCount > 0; }
    };
}

#endif // PLATFORM_ENGINE_SCENE_COMPONENTS_RELATIONSHIP_COMPONENT_HPP
