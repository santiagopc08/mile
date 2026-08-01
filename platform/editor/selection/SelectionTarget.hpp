#ifndef PLATFORM_EDITOR_SELECTION_SELECTION_TARGET_HPP
#define PLATFORM_EDITOR_SELECTION_SELECTION_TARGET_HPP

#include "engine/scene/Entity.hpp"
#include "engine/assets/AssetID.hpp"
#include <string>

namespace platform
{
    enum class SelectionType
    {
        None = 0,
        Entity,
        Asset,
        Folder,
        Component,
        Resource
    };

    struct SelectionTarget
    {
        SelectionType Type{SelectionType::None};
        EntityID Entity{kNullEntity};
        AssetID Asset{kInvalidAssetID};
        std::string PathStr;
        std::string Name;

        [[nodiscard]] bool IsValid() const { return Type != SelectionType::None; }
    };
}

#endif // PLATFORM_EDITOR_SELECTION_SELECTION_TARGET_HPP
