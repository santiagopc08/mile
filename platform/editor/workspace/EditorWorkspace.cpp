#include "editor/workspace/EditorWorkspace.hpp"
#include "editor/panels/ScenePanel.hpp"
#include "editor/panels/HierarchyPanel.hpp"
#include "editor/panels/InspectorPanel.hpp"
#include "editor/panels/ProjectPanel.hpp"
#include "editor/panels/AssetBrowserPanel.hpp"
#include "editor/panels/ConsolePanel.hpp"
#include "editor/panels/ProfilerPanel.hpp"
#include "engine/core/Logger.hpp"

#include <algorithm>

namespace platform
{
    namespace
    {
        constexpr float kSideWidth = 300.0f;
        constexpr float kBottomHeight = 190.0f;
        constexpr float kProjectHeight = 150.0f;
        constexpr float kProfilerHeight = 150.0f;
        constexpr float kGap = 4.0f;
    }

    EditorWorkspace::EditorWorkspace() = default;

    void EditorWorkspace::Initialize(EditorContext &context)
    {
        (void)context;

        m_scenePanel = std::make_shared<ScenePanel>();
        m_hierarchyPanel = std::make_shared<HierarchyPanel>();
        m_inspectorPanel = std::make_shared<InspectorPanel>();
        m_consolePanel = std::make_shared<ConsolePanel>();

        // Populate default panel layout
        m_dockspace.AddPanel(m_scenePanel, DockSlot::Center);
        m_dockspace.AddPanel(m_hierarchyPanel, DockSlot::Left);
        m_dockspace.AddPanel(m_inspectorPanel, DockSlot::Right);
        m_dockspace.AddPanel(std::make_shared<ProjectPanel>(), DockSlot::Left);
        m_dockspace.AddPanel(std::make_shared<AssetBrowserPanel>(), DockSlot::Bottom);
        m_dockspace.AddPanel(m_consolePanel, DockSlot::Bottom);
        m_dockspace.AddPanel(std::make_shared<ProfilerPanel>(), DockSlot::Floating);

        LOG_INFO("[EditorWorkspace] Editor Workspace initialized with 7 panels.");
    }

    void EditorWorkspace::LayoutPanels(float width, float height, float topInset, float bottomInset)
    {
        const float contentTop = topInset;
        const float contentHeight = std::max(120.0f, height - topInset - bottomInset);

        if (m_fullscreen)
        {
            // Fullscreen viewport: the scene takes the whole content area and the
            // surrounding panels step aside.
            m_viewportRect = {kGap, contentTop, width - kGap * 2.0f, contentHeight};
            for (auto &entry : m_dockspace.GetPanels())
            {
                if (entry.PanelPtr)
                {
                    entry.PanelPtr->SetBounds(entry.PanelPtr == m_scenePanel ? m_viewportRect : UIRect{});
                }
            }
            return;
        }

        const float sideWidth = std::min(kSideWidth, width * 0.24f);
        const float bottomHeight = std::min(kBottomHeight, contentHeight * 0.32f);

        const float centerX = sideWidth + kGap * 2.0f;
        const float centerWidth = std::max(160.0f, width - (sideWidth + kGap * 2.0f) * 2.0f);
        const float centerHeight = contentHeight - bottomHeight - kGap;

        m_viewportRect = {centerX, contentTop, centerWidth, centerHeight};

        for (auto &entry : m_dockspace.GetPanels())
        {
            if (!entry.PanelPtr)
            {
                continue;
            }

            const std::string &name = entry.PanelPtr->GetName();

            if (name == "Scene Viewport")
            {
                entry.PanelPtr->SetBounds(m_viewportRect);
            }
            else if (name == "Hierarchy")
            {
                entry.PanelPtr->SetBounds({kGap, contentTop, sideWidth, contentHeight - kProjectHeight - kGap});
            }
            else if (name == "Project VFS")
            {
                entry.PanelPtr->SetBounds({kGap, contentTop + contentHeight - kProjectHeight, sideWidth, kProjectHeight});
            }
            else if (name == "Inspector")
            {
                entry.PanelPtr->SetBounds({width - sideWidth - kGap, contentTop, sideWidth, contentHeight - kProfilerHeight - kGap});
            }
            else if (name == "Profiler")
            {
                entry.PanelPtr->SetBounds({width - sideWidth - kGap, contentTop + contentHeight - kProfilerHeight, sideWidth, kProfilerHeight});
            }
            else if (name == "Console")
            {
                const float consoleWidth = centerWidth * 0.62f;
                entry.PanelPtr->SetBounds({centerX, contentTop + centerHeight + kGap, consoleWidth, bottomHeight});
            }
            else if (name == "Asset Browser")
            {
                const float consoleWidth = centerWidth * 0.62f;
                entry.PanelPtr->SetBounds({centerX + consoleWidth + kGap, contentTop + centerHeight + kGap,
                                           centerWidth - consoleWidth - kGap, bottomHeight});
            }
        }
    }

    void EditorWorkspace::ToggleFullscreen()
    {
        m_fullscreen = !m_fullscreen;

        // Side panels are hidden outright so their click regions go away too.
        for (auto &entry : m_dockspace.GetPanels())
        {
            if (entry.PanelPtr && entry.PanelPtr != m_scenePanel)
            {
                entry.PanelPtr->SetVisible(!m_fullscreen);
            }
        }
    }

    void EditorWorkspace::Update(EditorContext &context, double dt)
    {
        for (auto &entry : m_dockspace.GetPanels())
        {
            if (entry.PanelPtr && entry.PanelPtr->IsVisible())
            {
                entry.PanelPtr->OnUpdate(context, dt);
            }
        }
    }

    void EditorWorkspace::Render(EditorContext &context)
    {
        m_dockspace.RenderAll(context);
    }

    bool EditorWorkspace::SaveLayout(const std::string &layoutFilePath)
    {
        m_activeLayoutPath = layoutFilePath;
        LOG_INFO("[EditorWorkspace] Saved editor layout to '{}'.", m_activeLayoutPath);
        return true;
    }

    bool EditorWorkspace::LoadLayout(const std::string &layoutFilePath)
    {
        m_activeLayoutPath = layoutFilePath;
        LOG_INFO("[EditorWorkspace] Loaded editor layout from '{}'.", m_activeLayoutPath);
        return true;
    }
}
