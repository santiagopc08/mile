#include "editor/selection/SelectionSystem.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void SelectionSystem::SetSelection(SelectionTarget target)
    {
        m_currentSelection = std::move(target);
        LOG_INFO("[SelectionSystem] Selection changed (Type: {}, Name: '{}').",
                 static_cast<int>(m_currentSelection.Type), m_currentSelection.Name);

        for (const auto &cb : m_callbacks)
        {
            if (cb)
            {
                cb(m_currentSelection);
            }
        }
    }

    void SelectionSystem::SetEntitySelection(EntityID entity, const std::string &name)
    {
        SelectionTarget target;
        target.Type = SelectionType::Entity;
        target.Entity = entity;
        target.Name = name.empty() ? "Entity #" + std::to_string(entity) : name;
        SetSelection(target);
    }

    void SelectionSystem::SetAssetSelection(AssetID assetID, const std::string &name)
    {
        SelectionTarget target;
        target.Type = SelectionType::Asset;
        target.Asset = assetID;
        target.Name = name;
        SetSelection(target);
    }

    void SelectionSystem::SetFolderSelection(const std::string &folderPath)
    {
        SelectionTarget target;
        target.Type = SelectionType::Folder;
        target.PathStr = folderPath;
        target.Name = folderPath;
        SetSelection(target);
    }

    void SelectionSystem::Clear()
    {
        SetSelection(SelectionTarget());
    }

    void SelectionSystem::OnSelectionChanged(SelectionChangedCallbackFn callback)
    {
        m_callbacks.push_back(std::move(callback));
    }
}
