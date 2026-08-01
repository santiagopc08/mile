#include "editor/panels/HierarchyPanel.hpp"
#include "editor/commands/EntityCommands.hpp"
#include "engine/scene/components/Components.hpp"
#include "engine/scene/components/RelationshipComponent.hpp"
#include "engine/core/Logger.hpp"

#include <algorithm>

namespace platform
{
    HierarchyPanel::HierarchyPanel() = default;

    std::string HierarchyPanel::EntityLabel(EditorContext &context, EntityID entity)
    {
        std::string name = "Entity";
        if (context.ActiveScene)
        {
            if (auto *nameComp = context.ActiveScene->GetRegistry().GetComponent<NameComponent>(entity))
            {
                name = nameComp->Name;
            }
        }
        return "#" + std::to_string(entity) + "  " + name;
    }

    void HierarchyPanel::OnRender(EditorContext &context)
    {
        if (!m_visible || !context.ActiveScene || !context.UI)
        {
            return;
        }

        auto &ui = *context.UI;
        auto &registry = context.ActiveScene->GetRegistry();
        const auto &entities = registry.GetAliveEntities();

        const UIRect content = ui.Panel(m_bounds, "HIERARCHY  (" + std::to_string(entities.size()) + ")");

        const float rowsHeight = static_cast<float>(entities.size()) * EditorTheme::RowHeight;
        const float maxScroll = std::max(0.0f, rowsHeight - content.Height + 6.0f);

        if (ui.IsHovered(content) && ui.ScrollDelta() != 0.0f)
        {
            m_scroll = std::clamp(m_scroll - ui.ScrollDelta() * EditorTheme::RowHeight * 2.0f, 0.0f, maxScroll);
        }
        m_scroll = std::clamp(m_scroll, 0.0f, maxScroll);

        if (entities.empty())
        {
            ui.TextClipped(content, content.X + 10.0f, content.Y + 10.0f, "Scene is empty.", EditorTheme::TextMuted);
            ui.TextClipped(content, content.X + 10.0f, content.Y + 30.0f, "Use NEW ENTITY above.", EditorTheme::TextDisabled);
            return;
        }

        const EntityID selected = context.Selection.GetSelection().Type == SelectionType::Entity
            ? context.Selection.GetSelection().Entity
            : kNullEntity;

        for (size_t i = 0; i < entities.size(); ++i)
        {
            const float rowY = content.Y + 3.0f + static_cast<float>(i) * EditorTheme::RowHeight - m_scroll;
            if (rowY + EditorTheme::RowHeight < content.Y || rowY > content.Bottom())
            {
                continue; // scrolled out of view
            }

            const UIRect row{content.X + 2.0f, rowY, content.Width - 4.0f, EditorTheme::RowHeight - 2.0f};
            const EntityID entity = entities[i];

            if (ui.Row(row, EntityLabel(context, entity), entity == selected))
            {
                SelectEntity(context, entity);
            }
        }

        // Scroll indicator.
        if (maxScroll > 0.0f)
        {
            const float trackHeight = content.Height - 6.0f;
            const float thumbHeight = std::max(24.0f, trackHeight * (content.Height / rowsHeight));
            const float thumbY = content.Y + 3.0f + (trackHeight - thumbHeight) * (m_scroll / maxScroll);
            ui.Rect({content.Right() - 5.0f, thumbY, 3.0f, thumbHeight}, EditorTheme::AccentDim);
        }
    }

    void HierarchyPanel::SelectEntity(EditorContext &context, EntityID entity)
    {
        if (!context.ActiveScene) return;
        std::string name = "Entity #" + std::to_string(entity);
        if (auto *nameComp = context.ActiveScene->GetRegistry().GetComponent<NameComponent>(entity))
        {
            name = nameComp->Name;
        }
        context.Selection.SetEntitySelection(entity, name);
    }

    void HierarchyPanel::CreateEntity(EditorContext &context, const std::string &name)
    {
        if (!context.ActiveScene) return;
        context.History.ExecuteCommand(std::make_unique<CreateEntityCommand>(context.ActiveScene, name));
    }

    void HierarchyPanel::DeleteEntity(EditorContext &context, EntityID entity)
    {
        if (!context.ActiveScene) return;
        context.History.ExecuteCommand(std::make_unique<DeleteEntityCommand>(context.ActiveScene, entity));
    }

    void HierarchyPanel::SetParent(EditorContext &context, EntityID child, EntityID parent)
    {
        if (!context.ActiveScene) return;
        auto &rel = context.ActiveScene->GetRegistry().AddComponent<RelationshipComponent>(child);
        rel.Parent = parent;
        LOG_INFO("[HierarchyPanel] Set Entity #{} parent -> Entity #{}.", child, parent);
    }

    void HierarchyPanel::Unparent(EditorContext &context, EntityID child)
    {
        if (!context.ActiveScene) return;
        if (auto *rel = context.ActiveScene->GetRegistry().GetComponent<RelationshipComponent>(child))
        {
            rel->Parent = kNullEntity;
        }
        LOG_INFO("[HierarchyPanel] Unparented Entity #{}.", child);
    }
}
