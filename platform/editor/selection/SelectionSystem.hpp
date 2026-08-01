#ifndef PLATFORM_EDITOR_SELECTION_SELECTION_SYSTEM_HPP
#define PLATFORM_EDITOR_SELECTION_SELECTION_SYSTEM_HPP

#include "editor/selection/SelectionTarget.hpp"
#include <functional>
#include <vector>

namespace platform
{
    using SelectionChangedCallbackFn = std::function<void(const SelectionTarget &target)>;

    class SelectionSystem
    {
    public:
        SelectionSystem() = default;

        void SetSelection(SelectionTarget target);
        void SetEntitySelection(EntityID entity, const std::string &name = "");
        void SetAssetSelection(AssetID assetID, const std::string &name = "");
        void SetFolderSelection(const std::string &folderPath);

        void Clear();

        [[nodiscard]] const SelectionTarget &GetSelection() const { return m_currentSelection; }
        [[nodiscard]] bool HasSelection() const { return m_currentSelection.IsValid(); }

        void OnSelectionChanged(SelectionChangedCallbackFn callback);

    private:
        SelectionTarget m_currentSelection;
        std::vector<SelectionChangedCallbackFn> m_callbacks;
    };
}

#endif // PLATFORM_EDITOR_SELECTION_SELECTION_SYSTEM_HPP
