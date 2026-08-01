#include "editor/panels/InspectorPanel.hpp"
#include "engine/scene/components/Components.hpp"
#include "engine/scene/components/PrefabComponent.hpp"
#include "engine/graphics/components/ShapeComponent.hpp"
#include "engine/graphics/components/VisibilityComponent.hpp"
#include "engine/core/Logger.hpp"

#include <array>
#include <cstdio>
#include <string>

namespace platform
{
    namespace
    {
        std::string Number(float value)
        {
            char buffer[32];
            std::snprintf(buffer, sizeof(buffer), "%.1f", static_cast<double>(value));
            return std::string(buffer);
        }
    }

    InspectorPanel::InspectorPanel() = default;

    bool InspectorPanel::DrawStepper(EditorContext &context, const UIRect &row, const std::string &label, float &value, float step)
    {
        auto &ui = *context.UI;

        ui.TextClipped(row, row.X, row.Y + 5.0f, label, EditorTheme::TextMuted);

        constexpr float buttonSize = 22.0f;
        const UIRect minus{row.Right() - buttonSize * 2.0f - 80.0f, row.Y, buttonSize, row.Height};
        const UIRect valueBox{minus.Right() + 2.0f, row.Y, 74.0f, row.Height};
        const UIRect plus{valueBox.Right() + 2.0f, row.Y, buttonSize, row.Height};

        bool edited = false;
        if (ui.Button(minus, "-"))
        {
            value -= step;
            edited = true;
        }

        ui.Rect(valueBox, EditorTheme::WindowBackground);
        ui.RectOutline(valueBox, EditorTheme::PanelBorder);
        ui.TextClipped(valueBox, valueBox.X + 6.0f, valueBox.Y + 5.0f, Number(value), EditorTheme::Text);

        if (ui.Button(plus, "+"))
        {
            value += step;
            edited = true;
        }

        return edited;
    }

    void InspectorPanel::OnRender(EditorContext &context)
    {
        if (!m_visible) return;

        const auto &selection = context.Selection.GetSelection();

        if (!context.UI)
        {
            // Headless fallback: keeps the panel inspectable from tests and log files.
            if (selection.Type == SelectionType::Entity && context.ActiveScene)
            {
                LOG_INFO("[InspectorPanel] Inspecting Entity '{}' (ID: {}).", selection.Name, selection.Entity);
            }
            return;
        }

        auto &ui = *context.UI;
        const UIRect content = ui.Panel(m_bounds, "INSPECTOR");
        const UIRect body = content.Inset(8.0f);

        if (selection.Type != SelectionType::Entity || !context.ActiveScene
            || !context.ActiveScene->GetRegistry().IsAlive(selection.Entity))
        {
            ui.TextClipped(body, body.X, body.Y + 6.0f, "Nothing selected.", EditorTheme::TextMuted);
            ui.TextClipped(body, body.X, body.Y + 30.0f, "Pick a row on the left", EditorTheme::TextDisabled);
            ui.TextClipped(body, body.X, body.Y + 46.0f, "or click a shape here.", EditorTheme::TextDisabled);
            return;
        }

        auto &registry = context.ActiveScene->GetRegistry();
        float cursorY = body.Y + 4.0f;

        ui.TextClipped(body, body.X, cursorY, selection.Name, EditorTheme::Text, EditorTheme::TitleScale);
        cursorY += 26.0f;
        ui.TextClipped(body, body.X, cursorY, "ENTITY ID " + std::to_string(selection.Entity), EditorTheme::TextDisabled);
        cursorY += 24.0f;

        auto *transform = registry.GetComponent<TransformComponent>(selection.Entity);
        if (!transform)
        {
            ui.TextClipped(body, body.X, cursorY, "No TransformComponent.", EditorTheme::Warning);
            cursorY += 26.0f;
            if (ui.Button({body.X, cursorY, 170.0f, 24.0f}, "ADD TRANSFORM"))
            {
                registry.AddComponent<TransformComponent>(selection.Entity);
                context.Log("Info", "Added TransformComponent to '" + selection.Name + "'.");
            }
            return;
        }

        ui.Line({body.X, cursorY}, {body.Right(), cursorY}, EditorTheme::PanelBorder);
        cursorY += 10.0f;
        ui.TextClipped(body, body.X, cursorY, "TRANSFORM", EditorTheme::Accent);
        cursorY += 24.0f;

        bool edited = false;
        edited = DrawStepper(context, {body.X, cursorY, body.Width, 22.0f}, "POSITION X", transform->Position.x, m_step) || edited;
        cursorY += 26.0f;
        edited = DrawStepper(context, {body.X, cursorY, body.Width, 22.0f}, "POSITION Y", transform->Position.y, m_step) || edited;
        cursorY += 26.0f;
        edited = DrawStepper(context, {body.X, cursorY, body.Width, 22.0f}, "ROTATION", transform->Rotation, 15.0f) || edited;
        cursorY += 26.0f;
        edited = DrawStepper(context, {body.X, cursorY, body.Width, 22.0f}, "SCALE X", transform->Scale.x, 0.25f) || edited;
        cursorY += 26.0f;
        edited = DrawStepper(context, {body.X, cursorY, body.Width, 22.0f}, "SCALE Y", transform->Scale.y, 0.25f) || edited;
        cursorY += 30.0f;

        if (edited)
        {
            transform->MarkDirty();
        }

        ui.TextClipped(body, body.X, cursorY + 4.0f, "STEP", EditorTheme::TextMuted);
        constexpr std::array<float, 4> steps{1.0f, 5.0f, 10.0f, 50.0f};
        constexpr std::array<const char *, 4> stepLabels{"1", "5", "10", "50"};
        for (size_t i = 0; i < steps.size(); ++i)
        {
            const UIRect stepButton{body.X + 54.0f + static_cast<float>(i) * 40.0f, cursorY, 36.0f, 22.0f};
            if (ui.Button(stepButton, stepLabels[i], true, m_step == steps[i]))
            {
                m_step = steps[i];
            }
        }
        cursorY += 34.0f;

        ui.Line({body.X, cursorY}, {body.Right(), cursorY}, EditorTheme::PanelBorder);
        cursorY += 10.0f;

        auto *shape = registry.GetComponent<ShapeComponent>(selection.Entity);
        ui.TextClipped(body, body.X, cursorY, "SHAPE", EditorTheme::Accent);
        cursorY += 24.0f;

        if (!shape)
        {
            if (ui.Button({body.X, cursorY, 170.0f, 24.0f}, "ADD SHAPE"))
            {
                auto &added = registry.AddComponent<ShapeComponent>(selection.Entity);
                added.Size = {90.0f, 90.0f};
                added.Color = EditorTheme::Accent;
                if (!registry.HasComponent<VisibilityComponent>(selection.Entity))
                {
                    registry.AddComponent<VisibilityComponent>(selection.Entity);
                }
                context.Log("Info", "Added ShapeComponent to '" + selection.Name + "'.");
            }
            return;
        }

        DrawStepper(context, {body.X, cursorY, body.Width, 22.0f}, "WIDTH", shape->Size.x, m_step);
        cursorY += 26.0f;
        DrawStepper(context, {body.X, cursorY, body.Width, 22.0f}, "HEIGHT", shape->Size.y, m_step);
        cursorY += 32.0f;

        ui.TextClipped(body, body.X, cursorY, "COLOR", EditorTheme::TextMuted);
        cursorY += 20.0f;

        constexpr std::array<glm::vec4, 6> palette{
            glm::vec4{0.20f, 0.72f, 0.92f, 1.0f},
            glm::vec4{0.38f, 0.84f, 0.52f, 1.0f},
            glm::vec4{0.96f, 0.72f, 0.28f, 1.0f},
            glm::vec4{0.92f, 0.36f, 0.36f, 1.0f},
            glm::vec4{0.72f, 0.48f, 0.94f, 1.0f},
            glm::vec4{0.86f, 0.90f, 0.94f, 1.0f},
        };

        for (size_t i = 0; i < palette.size(); ++i)
        {
            const UIRect swatch{body.X + static_cast<float>(i) * 32.0f, cursorY, 26.0f, 22.0f};
            const bool isCurrent = shape->Color == palette[i];
            ui.Rect(swatch, palette[i]);
            ui.RectOutline(swatch, isCurrent ? EditorTheme::Text : EditorTheme::PanelBorder, isCurrent ? 2.0f : 1.0f);
            if (ui.ClickArea(swatch))
            {
                shape->Color = palette[i];
                context.Log("Info", "Recolored '" + selection.Name + "'.");
            }
        }
        cursorY += 32.0f;

        if (auto *visibility = registry.GetComponent<VisibilityComponent>(selection.Entity))
        {
            if (ui.Button({body.X, cursorY, 170.0f, 24.0f}, visibility->Visible ? "VISIBLE: ON" : "VISIBLE: OFF", true,
                          visibility->Visible))
            {
                visibility->Visible = !visibility->Visible;
            }
            cursorY += 30.0f;
        }

        if (auto *prefabComp = registry.GetComponent<PrefabComponent>(selection.Entity))
        {
            ui.TextClipped(body, body.X, cursorY,
                           "PREFAB " + std::to_string(prefabComp->PrefabID) + (prefabComp->IsOverridden ? " *" : ""),
                           EditorTheme::TextMuted);
            cursorY += 24.0f;
            if (ui.Button({body.X, cursorY, 80.0f, 22.0f}, "APPLY"))
            {
                ApplyPrefabOverrides(context, selection.Entity);
            }
            if (ui.Button({body.X + 84.0f, cursorY, 80.0f, 22.0f}, "REVERT"))
            {
                RevertPrefabOverrides(context, selection.Entity);
            }
        }
    }

    void InspectorPanel::ApplyPrefabOverrides(EditorContext &context, EntityID entity)
    {
        if (!context.ActiveScene) return;
        m_prefabManager.ApplyOverrides(context.ActiveScene->GetRegistry(), entity);
    }

    void InspectorPanel::RevertPrefabOverrides(EditorContext &context, EntityID entity)
    {
        if (!context.ActiveScene) return;
        m_prefabManager.RevertOverrides(context.ActiveScene->GetRegistry(), entity);
    }
}
