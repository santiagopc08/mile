#include "engine/assets/Asset.hpp"

namespace platform
{
    Asset::Asset() = default;

    Asset::Asset(AssetMetadata metadata)
        : m_metadata(std::move(metadata))
    {
    }
}
