#ifndef PLATFORM_EDITOR_PANELS_ASSET_BROWSER_PANEL_HPP
#define PLATFORM_EDITOR_PANELS_ASSET_BROWSER_PANEL_HPP

#include "editor/panels/EditorPanel.hpp"

namespace platform
{
    class AssetBrowserPanel : public EditorPanel
    {
    public:
        AssetBrowserPanel();

        void OnRender(EditorContext &context) override;
        [[nodiscard]] const std::string &GetName() const override { return m_name; }

    private:
        std::string m_name{"Asset Browser"};
    };
}

#endif // PLATFORM_EDITOR_PANELS_ASSET_BROWSER_PANEL_HPP
